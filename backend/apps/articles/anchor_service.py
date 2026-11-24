import difflib
from apps.articles.models import Article, ArticleInlineAnnotation


class AnchorResilienceService:
    """
    Fuzzy Anchor Matching Engine: Keeps inline text annotations resilient and accurately
    positioned across document revisions, whitespace normalization, and content edits.
    """

    @classmethod
    def resolve_anchor(cls, content: str, annotation: ArticleInlineAnnotation) -> dict:
        """
        Locate the current position of an annotation's highlighted text in document content.
        Returns:
            {
                "start_offset": int,
                "end_offset": int,
                "match_confidence": float (0.0 to 1.0),
                "is_orphaned": bool,
                "matched_text": str
            }
        """
        if not content:
            return {
                "start_offset": annotation.start_offset,
                "end_offset": annotation.end_offset,
                "match_confidence": 0.0,
                "is_orphaned": True,
                "matched_text": "",
            }

        target_text = annotation.highlighted_text.strip()
        if not target_text:
            return {
                "start_offset": annotation.start_offset,
                "end_offset": annotation.end_offset,
                "match_confidence": 0.0,
                "is_orphaned": True,
                "matched_text": "",
            }

        # 1. Exact Offset Match Check
        start = annotation.start_offset
        end = annotation.end_offset
        if 0 <= start < len(content) and end <= len(content) and end > start:
            if content[start:end].strip() == target_text:
                return {
                    "start_offset": start,
                    "end_offset": end,
                    "match_confidence": 1.0,
                    "is_orphaned": False,
                    "matched_text": content[start:end],
                }

        # 2. Context-Aware Exact Text Search
        occurrences = []
        search_idx = 0
        while True:
            idx = content.find(target_text, search_idx)
            if idx == -1:
                break
            occurrences.append(idx)
            search_idx = idx + 1

        if len(occurrences) == 1:
            idx = occurrences[0]
            return {
                "start_offset": idx,
                "end_offset": idx + len(target_text),
                "match_confidence": 0.98,
                "is_orphaned": False,
                "matched_text": target_text,
            }
        elif len(occurrences) > 1:
            # Score occurrences using surrounding context anchors
            best_idx = occurrences[0]
            best_score = -1.0
            ctx_before = annotation.anchor_context_before.strip()
            ctx_after = annotation.anchor_context_after.strip()

            for idx in occurrences:
                score = 0.0
                actual_before = content[max(0, idx - len(ctx_before)):idx].strip()
                actual_after = content[idx + len(target_text):min(len(content), idx + len(target_text) + len(ctx_after))].strip()

                if ctx_before and actual_before:
                    score += difflib.SequenceMatcher(None, ctx_before, actual_before).ratio()
                if ctx_after and actual_after:
                    score += difflib.SequenceMatcher(None, ctx_after, actual_after).ratio()

                if score > best_score:
                    best_score = score
                    best_idx = idx

            return {
                "start_offset": best_idx,
                "end_offset": best_idx + len(target_text),
                "match_confidence": round(0.90 + min(0.08, best_score * 0.04), 2),
                "is_orphaned": False,
                "matched_text": target_text,
            }

        # 3. Fuzzy Window Search (for minor typo fixes or modified words)
        words = target_text.split()
        if len(words) >= 3:
            first_word = words[0]
            candidate_indices = []
            c_idx = 0
            while True:
                idx = content.find(first_word, c_idx)
                if idx == -1:
                    break
                candidate_indices.append(idx)
                c_idx = idx + 1

            target_len = len(target_text)
            best_fuzzy_idx = -1
            best_ratio = 0.0

            for idx in candidate_indices:
                window_slice = content[idx:min(len(content), idx + int(target_len * 1.3))]
                ratio = difflib.SequenceMatcher(None, target_text, window_slice[:target_len]).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_fuzzy_idx = idx

            if best_ratio >= 0.75:
                return {
                    "start_offset": best_fuzzy_idx,
                    "end_offset": best_fuzzy_idx + target_len,
                    "match_confidence": round(best_ratio, 2),
                    "is_orphaned": False,
                    "matched_text": content[best_fuzzy_idx:best_fuzzy_idx + target_len],
                }

        # 4. Text Completely Removed -> Orphaned
        return {
            "start_offset": annotation.start_offset,
            "end_offset": annotation.end_offset,
            "match_confidence": 0.0,
            "is_orphaned": True,
            "matched_text": "",
        }

    @classmethod
    def realign_article_annotations(cls, article: Article) -> list[dict]:
        """
        Realign all annotations attached to an article against current article content,
        persisting shifted start/end offsets and updating surrounding context.
        """
        content = article.content or ""
        annotations = article.inline_annotations.all()
        realigned = []

        for ann in annotations:
            res = cls.resolve_anchor(content, ann)
            if not res["is_orphaned"] and res["match_confidence"] >= 0.75:
                # Update persisted offsets if shifted
                new_start = res["start_offset"]
                new_end = res["end_offset"]
                if new_start != ann.start_offset or new_end != ann.end_offset:
                    ann.start_offset = new_start
                    ann.end_offset = new_end
                    ann.anchor_context_before = content[max(0, new_start - 60):new_start]
                    ann.anchor_context_after = content[new_end:min(len(content), new_end + 60)]
                    ann.save(update_fields=["start_offset", "end_offset", "anchor_context_before", "anchor_context_after", "updated_at"])

            realigned.append({
                "annotation_id": str(ann.id),
                "highlighted_text": ann.highlighted_text,
                "start_offset": ann.start_offset,
                "end_offset": ann.end_offset,
                "match_confidence": res["match_confidence"],
                "is_orphaned": res["is_orphaned"],
            })

        return realigned
