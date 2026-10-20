import api from "./api";
import type {
  ArticleRevision,
  RevisionListItem,
  RevisionDiffResult,
  RestoreRevisionResponse,
} from "../types/revision";

export const revisionService = {
  /**
   * Fetch all revisions for a specific article ordered by newest first.
   * GET /api/v1/articles/{slug}/revisions/
   */
  async getArticleRevisions(slug: string): Promise<RevisionListItem[]> {
    const response = await api.get<RevisionListItem[]>(`/articles/${slug}/revisions/`);
    return response.data;
  },

  /**
   * Fetch single revision snapshot by revision number.
   * GET /api/v1/articles/{slug}/revisions/{revNum}/
   */
  async getArticleRevision(slug: string, revNum: number): Promise<ArticleRevision> {
    const response = await api.get<ArticleRevision>(`/articles/${slug}/revisions/${revNum}/`);
    return response.data;
  },

  /**
   * Compare two revisions and calculate structured diff and unified line diff.
   * GET /api/v1/articles/{slug}/revisions/diff/?from={fromRev}&to={toRev}
   */
  async getRevisionDiff(
    slug: string,
    fromRev: number,
    toRev: number
  ): Promise<RevisionDiffResult> {
    const response = await api.get<RevisionDiffResult>(
      `/articles/${slug}/revisions/diff/`,
      {
        params: { from: fromRev, to: toRev },
      }
    );
    return response.data;
  },

  /**
   * Safely restore an article to a prior revision snapshot.
   * Preserves non-destructive linear history by creating a new revision #N.
   * POST /api/v1/articles/{slug}/revisions/{revNum}/restore/
   */
  async restoreRevision(
    slug: string,
    revNum: number,
    reason?: string
  ): Promise<RestoreRevisionResponse> {
    const response = await api.post<RestoreRevisionResponse>(
      `/articles/${slug}/revisions/${revNum}/restore/`,
      { reason: reason || "" }
    );
    return response.data;
  },
};

export default revisionService;
