import re
from collections import defaultdict
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from apps.articles.models import Article


CATEGORY_COLORS = {
    "Engineering": "#3b82f6",     # Blue
    "Product": "#10b981",         # Emerald
    "Design": "#ec4899",          # Pink
    "DevOps & Infra": "#8b5cf6",  # Violet
    "Architecture": "#f59e0b",    # Amber
    "Security": "#ef4444",        # Red
    "HR & Culture": "#06b6d4",    # Cyan
    "Uncategorized": "#94a3b8",   # Slate
}

def get_category_color(cat_name):
    if not cat_name:
        return CATEGORY_COLORS["Uncategorized"]
    if cat_name in CATEGORY_COLORS:
        return CATEGORY_COLORS[cat_name]
    palette = ["#3b82f6", "#10b981", "#ec4899", "#8b5cf6", "#f59e0b", "#06b6d4", "#14b8a6", "#f97316"]
    h = sum(ord(c) for c in cat_name)
    return palette[h % len(palette)]


class KnowledgeGraphView(APIView):
    """
    Computes an interactive 2D node-link network representation of the enterprise wiki.
    Nodes represent articles and edges represent direct internal citations, shared tags, or category clusters.
    URL: GET /api/v1/articles/graph/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        category_filter = request.query_params.get("category")
        include_drafts = request.query_params.get("include_drafts", "").lower() == "true"
        orphans_only = request.query_params.get("orphans_only", "").lower() == "true"

        # Base queryset: published articles visible to all; authors/admins can view their drafts
        qs = Article.objects.select_related("author", "category").prefetch_related("tags")

        if include_drafts and user.role in ["ADMIN", "AUTHOR"]:
            if user.role == "ADMIN":
                qs = qs.exclude(status=Article.Status.ARCHIVED)
            else:
                qs = qs.filter(
                    models_status_q := (Article.objects.filter(status=Article.Status.PUBLISHED) |
                                        Article.objects.filter(author=user))
                )
        else:
            qs = qs.filter(status=Article.Status.PUBLISHED)

        if category_filter and category_filter.lower() != "all":
            qs = qs.filter(category__name__iexact=category_filter.strip())

        articles = list(qs)
        if not articles:
            return Response({
                "nodes": [],
                "edges": [],
                "categories": [],
                "metrics": {
                    "total_nodes": 0,
                    "total_edges": 0,
                    "orphan_count": 0,
                    "density": 0,
                    "top_hub": None,
                }
            }, status=status.HTTP_200_OK)

        slug_to_article = {art.slug: art for art in articles}
        node_degrees = defaultdict(int)
        edges = []
        edge_set = set()

        # 1. Direct Citation Extraction: Regex for /articles/<slug> or [[<slug>]]
        link_regex = re.compile(r'(?:/articles/([a-zA-Z0-9_\-]+)|\[\[([a-zA-Z0-9_\-]+)(?:\|[^\]]+)?\]\])')

        for source in articles:
            content = source.content or ""
            matches = link_regex.findall(content)
            for m in matches:
                target_slug = m[0] or m[1]
                if target_slug and target_slug in slug_to_article and target_slug != source.slug:
                    edge_key = tuple(sorted([source.slug, target_slug]))
                    if edge_key not in edge_set:
                        edge_set.add(edge_key)
                        edges.append({
                            "source": source.slug,
                            "target": target_slug,
                            "link_type": "direct_citation",
                            "weight": 3,
                            "label": "References",
                        })
                        node_degrees[source.slug] += 1
                        node_degrees[target_slug] += 1

        # 2. Tag Similarity Linkage (if articles share 2 or more tags, or share 1 tag and no edge yet)
        tag_to_slugs = defaultdict(list)
        for art in articles:
            for tag in art.tags.all():
                tag_to_slugs[tag.name].append(art.slug)

        for tag_name, member_slugs in tag_to_slugs.items():
            if len(member_slugs) > 1 and len(member_slugs) <= 8:  # avoid hyper-connected massive clusters
                for i in range(len(member_slugs)):
                    for j in range(i + 1, len(member_slugs)):
                        s1, s2 = member_slugs[i], member_slugs[j]
                        edge_key = tuple(sorted([s1, s2]))
                        if edge_key not in edge_set:
                            edge_set.add(edge_key)
                            edges.append({
                                "source": s1,
                                "target": s2,
                                "link_type": "shared_tag",
                                "weight": 1.5,
                                "label": f"#{tag_name}",
                            })
                            node_degrees[s1] += 1
                            node_degrees[s2] += 1

        # 3. Build Nodes Payload
        nodes = []
        categories_seen = set()

        for art in articles:
            cat_name = art.category.name if art.category else "Uncategorized"
            categories_seen.add(cat_name)
            deg = node_degrees[art.slug]
            is_orphan = (deg == 0)

            if orphans_only and not is_orphan:
                continue

            nodes.append({
                "id": str(art.id),
                "slug": art.slug,
                "title": art.title,
                "summary": art.summary or "",
                "category": cat_name,
                "category_color": get_category_color(cat_name),
                "tags": [t.name for t in art.tags.all()],
                "reading_time": art.estimated_read_time,
                "view_count": art.view_count,
                "status": art.status,
                "author": art.author.full_name or art.author.username if art.author else "Unknown",
                "degree": deg,
                "is_orphan": is_orphan,
                "updated_at": art.updated_at.isoformat(),
            })

        # Filter edges if orphans_only was requested
        if orphans_only:
            edges = []

        # Graph Metrics
        total_nodes = len(nodes)
        total_edges = len(edges)
        orphan_count = sum(1 for n in nodes if n["is_orphan"])
        density = round((2.0 * total_edges) / (total_nodes * (total_nodes - 1)), 4) if total_nodes > 1 else 0.0

        top_hub = None
        if nodes:
            best_node = max(nodes, key=lambda n: n["degree"])
            if best_node["degree"] > 0:
                top_hub = {
                    "slug": best_node["slug"],
                    "title": best_node["title"],
                    "degree": best_node["degree"],
                }

        return Response({
            "nodes": nodes,
            "edges": edges,
            "categories": sorted(list(categories_seen)),
            "metrics": {
                "total_nodes": total_nodes,
                "total_edges": total_edges,
                "orphan_count": orphan_count,
                "density": density,
                "top_hub": top_hub,
            }
        }, status=status.HTTP_200_OK)


class ArticleNeighborhoodGraphView(APIView):
    """
    Computes local 1-hop neighborhood for a specific article:
    - Inbound citations (articles referencing this article)
    - Outbound citations (articles referenced by this article)
    - Shared-tag related articles
    URL: GET /api/v1/articles/<slug_or_id>/graph-neighborhood/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, slug_or_id, *args, **kwargs):
        article = Article.objects.filter(slug=slug_or_id).first()
        if not article:
            import uuid
            try:
                valid_uuid = uuid.UUID(str(slug_or_id))
                article = Article.objects.filter(id=valid_uuid).first()
            except (ValueError, TypeError):
                pass

        if not article:
            return Response({"error": "Article not found."}, status=status.HTTP_404_NOT_FOUND)

        published_qs = Article.objects.filter(status=Article.Status.PUBLISHED).select_related("category", "author").prefetch_related("tags")
        all_articles = list(published_qs)
        slug_to_art = {a.slug: a for a in all_articles}

        link_regex = re.compile(r'(?:/articles/([a-zA-Z0-9_\-]+)|\[\[([a-zA-Z0-9_\-]+)(?:\|[^\]]+)?\]\])')

        # 1. Outbound citations
        outbound_slugs = set()
        for m in link_regex.findall(article.content or ""):
            target_slug = m[0] or m[1]
            if target_slug and target_slug in slug_to_art and target_slug != article.slug:
                outbound_slugs.add(target_slug)

        # 2. Inbound citations
        inbound_slugs = set()
        for other in all_articles:
            if other.slug == article.slug:
                continue
            for m in link_regex.findall(other.content or ""):
                target_slug = m[0] or m[1]
                if target_slug == article.slug:
                    inbound_slugs.add(other.slug)
                    break

        # 3. Shared tag neighbors
        tag_ids = set(article.tags.values_list("id", flat=True))
        tag_neighbor_slugs = set()
        if tag_ids:
            for other in all_articles:
                if other.slug != article.slug and other.slug not in outbound_slugs and other.slug not in inbound_slugs:
                    other_tag_ids = set(other.tags.values_list("id", flat=True))
                    if tag_ids.intersection(other_tag_ids):
                        tag_neighbor_slugs.add(other.slug)

        cat_name = article.category.name if article.category else "Uncategorized"
        center_node = {
            "id": str(article.id),
            "slug": article.slug,
            "title": article.title,
            "category": cat_name,
            "category_color": get_category_color(cat_name),
            "reading_time": article.estimated_read_time,
            "view_count": article.view_count,
        }

        neighbors = []
        edges = []

        for slug in outbound_slugs:
            art = slug_to_art[slug]
            cname = art.category.name if art.category else "Uncategorized"
            neighbors.append({
                "slug": art.slug,
                "title": art.title,
                "category": cname,
                "category_color": get_category_color(cname),
                "relationship": "outbound",
            })
            edges.append({
                "source": article.slug,
                "target": art.slug,
                "type": "outbound",
                "label": "References",
            })

        for slug in inbound_slugs:
            if slug in outbound_slugs:
                continue
            art = slug_to_art[slug]
            cname = art.category.name if art.category else "Uncategorized"
            neighbors.append({
                "slug": art.slug,
                "title": art.title,
                "category": cname,
                "category_color": get_category_color(cname),
                "relationship": "inbound",
            })
            edges.append({
                "source": art.slug,
                "target": article.slug,
                "type": "inbound",
                "label": "Referenced by",
            })

        for slug in list(tag_neighbor_slugs)[:5]:
            art = slug_to_art[slug]
            cname = art.category.name if art.category else "Uncategorized"
            neighbors.append({
                "slug": art.slug,
                "title": art.title,
                "category": cname,
                "category_color": get_category_color(cname),
                "relationship": "shared_tag",
            })
            edges.append({
                "source": article.slug,
                "target": art.slug,
                "type": "shared_tag",
                "label": "Shared topic",
            })

        return Response({
            "center_node": center_node,
            "neighbors": neighbors,
            "edges": edges,
            "inbound_count": len(inbound_slugs),
            "outbound_count": len(outbound_slugs),
            "shared_tag_count": len(tag_neighbor_slugs),
            "total_connections": len(neighbors),
        }, status=status.HTTP_200_OK)
