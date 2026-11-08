from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import CustomUser
from apps.articles.models import Article
from apps.taxonomy.models import Category, Tag


class KnowledgeGraphAPITests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            email="author@example.com",
            username="graph_author",
            password="password123",
            full_name="Graph Author",
            role=CustomUser.Role.AUTHOR,
        )
        self.cat_eng = Category.objects.create(name="Engineering", slug="engineering")
        self.cat_ops = Category.objects.create(name="DevOps", slug="devops")

        self.tag_python = Tag.objects.create(name="python", slug="python")
        self.tag_docker = Tag.objects.create(name="docker", slug="docker")

        # Article 1: references Article 2 in its content
        self.art1 = Article.objects.create(
            title="Python Microservices Guide",
            slug="python-microservices-guide",
            summary="Building services with Python.",
            content="Check our deployment at [Docker Setup](/articles/docker-deployment-guide) and wikilink [[kubernetes-cluster]].",
            author=self.user,
            category=self.cat_eng,
            status=Article.Status.PUBLISHED,
        )
        self.art1.tags.add(self.tag_python, self.tag_docker)

        # Article 2: Target of direct link, shares docker tag
        self.art2 = Article.objects.create(
            title="Docker Deployment Guide",
            slug="docker-deployment-guide",
            summary="Containerizing services.",
            content="Deploy containers with ease.",
            author=self.user,
            category=self.cat_ops,
            status=Article.Status.PUBLISHED,
        )
        self.art2.tags.add(self.tag_docker)

        # Article 3: Target of wikilink
        self.art3 = Article.objects.create(
            title="Kubernetes Cluster Setup",
            slug="kubernetes-cluster",
            summary="K8s cluster instructions.",
            content="K8s cluster setup.",
            author=self.user,
            category=self.cat_ops,
            status=Article.Status.PUBLISHED,
        )

        # Article 4: Orphan article (no links, no shared tags)
        self.art4 = Article.objects.create(
            title="HR Vacation Policy",
            slug="hr-vacation-policy",
            summary="Taking leave.",
            content="Vacation guidelines.",
            author=self.user,
            category=None,
            status=Article.Status.PUBLISHED,
        )

    def test_unauthenticated_graph_fails(self):
        res = self.client.get("/api/v1/articles/graph/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_graph_computes_nodes_and_edges(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/v1/articles/graph/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertEqual(len(data["nodes"]), 4)
        self.assertGreaterEqual(len(data["edges"]), 2)

        # Check nodes
        node_map = {n["slug"]: n for n in data["nodes"]}
        self.assertIn("python-microservices-guide", node_map)
        self.assertIn("hr-vacation-policy", node_map)

        # HR article should be orphan
        self.assertTrue(node_map["hr-vacation-policy"]["is_orphan"])
        self.assertEqual(node_map["hr-vacation-policy"]["degree"], 0)

        # Art1 should have degree >= 2 (links to art2 and art3)
        self.assertGreaterEqual(node_map["python-microservices-guide"]["degree"], 2)
        self.assertFalse(node_map["python-microservices-guide"]["is_orphan"])

        # Check metrics
        self.assertEqual(data["metrics"]["total_nodes"], 4)
        self.assertEqual(data["metrics"]["orphan_count"], 1)
        self.assertIsNotNone(data["metrics"]["top_hub"])

    def test_orphans_only_filter(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/v1/articles/graph/?orphans_only=true")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        nodes = res.data["nodes"]
        self.assertEqual(len(nodes), 1)
        self.assertEqual(nodes[0]["slug"], "hr-vacation-policy")

    def test_article_neighborhood_graph(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get(f"/api/v1/articles/{self.art1.slug}/graph-neighborhood/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        data = res.data
        self.assertEqual(data["center_node"]["slug"], self.art1.slug)
        self.assertGreaterEqual(data["outbound_count"], 2) # links to docker and k8s
        self.assertGreaterEqual(data["total_connections"], 2)

        # Test non-existent slug returns 404
        res404 = self.client.get("/api/v1/articles/non-existent-article-slug/graph-neighborhood/")
        self.assertEqual(res404.status_code, status.HTTP_404_NOT_FOUND)
