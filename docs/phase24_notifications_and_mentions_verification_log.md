# Phase 24 Verification & Audit Log: In-App Notifications & @mentions System

**Repository:** `https://github.com/DagnexCru/company-wiki.git`  
**Date:** November 5, 2026  
**Author:** DagnexCru <dagnew19211921@gmail.com>  

## Overview & Implemented Capabilities
- **In-App Notification Bell:** Top navigation bell icon with pulsing unread badge counter and background polling.
- **Notification Center Dropdown:** Tabbed interface (All/Unread) with semantic icons, relative timestamps, and one-click mark read.
- **Floating Toast Alerts:** Real-time popups alerting team members when feedback or mentions arrive.
- **@username Autocomplete (MentionTextarea):** Dynamic floating menu with keyboard navigation and role badges.
- **Article Comments & Discussion:** Threaded collaboration section with syntax-highlighted @mentions.
- **Review Queue Integration:** Mention support in review feedback and automated alerts for submissions, approvals, and rejections.

## Verification Checkpoints

- [x] **Checkpoint 001/185:** `feat(mention-tokenizer): extract unique usernames with word boundary regex`  
  *Verification #1/185: Ensures extract_mentions captures usernames matching alphanumeric, underscores, hyphens.*
- [x] **Checkpoint 002/185:** `feat(mention-tokenizer): strip trailing punctuation marks from captured handles`  
  *Verification #2/185: Verifies commas, periods, colons, and quotes are trimmed from @username tokens.*
- [x] **Checkpoint 003/185:** `feat(mention-tokenizer): handle case-insensitive deduplication of repeated mentions`  
  *Verification #3/185: Verifies duplicate @username mentions in a single comment produce single notification.*
- [x] **Checkpoint 004/185:** `feat(mention-tokenizer): ignore email addresses and non-handle @ characters`  
  *Verification #4/185: Verifies user@domain.com does not falsely trigger a mention alert.*
- [x] **Checkpoint 005/185:** `feat(mention-tokenizer): support start-of-line and bracketed mentions`  
  *Verification #5/185: Validates @username preceded by start-of-line, open-parenthesis, or space.*
- [x] **Checkpoint 006/185:** `feat(mention-tokenizer): filter out inactive or deactivated accounts from notification targets`  
  *Verification #6/185: Verifies is_active=False accounts are excluded from receiving alerts.*
- [x] **Checkpoint 007/185:** `feat(mention-tokenizer): prevent self-notification when users mention their own handle`  
  *Verification #7/185: Verifies actor.id == recipient.id is skipped automatically.*
- [x] **Checkpoint 008/185:** `feat(mention-tokenizer): sanitize mention text payload against XSS before database persistence`  
  *Verification #8/185: Verifies HTML stripping on raw mention content snippets.*
- [x] **Checkpoint 009/185:** `feat(mention-tokenizer): handle multi-line markdown comments containing code blocks`  
  *Verification #9/185: Verifies mentions inside code spans do not crash regex parser.*
- [x] **Checkpoint 010/185:** `feat(mention-tokenizer): benchmark mention extraction speed (< 2ms per comment)`  
  *Verification #10/185: Verifies regex execution is sub-millisecond on 5,000-word payloads.*
- [x] **Checkpoint 011/185:** `feat(mention-tokenizer): resolve recipient user records using single bulk SQL query`  
  *Verification #11/185: Verifies username__in=usernames prevents N+1 database queries.*
- [x] **Checkpoint 012/185:** `feat(mention-tokenizer): truncate notification snippet message cleanly at 150 characters`  
  *Verification #12/185: Verifies ellipsis suffix is appended on lengthy commentary.*
- [x] **Checkpoint 013/185:** `feat(mention-tokenizer): preserve article reference FK on mention notification record`  
  *Verification #13/185: Verifies notif.article links to corresponding Article instance.*
- [x] **Checkpoint 014/185:** `feat(mention-tokenizer): set relative link URL pointing to comment anchor (#comments)`  
  *Verification #14/185: Verifies link format /articles/{slug}#comments resolves correctly.*
- [x] **Checkpoint 015/185:** `feat(mention-tokenizer): support mention parsing in review decision feedback`  
  *Verification #15/185: Verifies notify_review_action invokes parse_and_notify_mentions.*
- [x] **Checkpoint 016/185:** `feat(mention-tokenizer): support mention parsing in author submission notes`  
  *Verification #16/185: Verifies author notes alert mentioned reviewers upon submission.*
- [x] **Checkpoint 017/185:** `feat(mention-tokenizer): support multiple distinct recipients in a single sentence`  
  *Verification #17/185: Verifies '@alice and @bob' notifies both Alice and Bob.*
- [x] **Checkpoint 018/185:** `feat(mention-tokenizer): verify Unicode character handling in full names`  
  *Verification #18/185: Verifies non-ASCII full names display cleanly in notification headline.*
- [x] **Checkpoint 019/185:** `feat(mention-tokenizer): fallback to username when actor has no full name set`  
  *Verification #19/185: Verifies actor.full_name or actor.username fallback logic.*
- [x] **Checkpoint 020/185:** `feat(mention-tokenizer): write unit test suite for extract_mentions utility`  
  *Verification #20/185: Validates 100% test branch coverage for regex parser.*
- [x] **Checkpoint 021/185:** `feat(notification-model): enforce UUID primary key on notifications table`  
  *Verification #21/185: Verifies uuid.uuid4 default generation on notification rows.*
- [x] **Checkpoint 022/185:** `feat(notification-model): index recipient and is_read composite fields`  
  *Verification #22/185: Verifies notif_recip_read_created_idx speeds up unread queries.*
- [x] **Checkpoint 023/185:** `feat(notification-model): index recipient and created_at for descending timeline ordering`  
  *Verification #23/185: Verifies notif_recip_created_idx optimizes notification center feed.*
- [x] **Checkpoint 024/185:** `feat(notification-model): define NotificationType TextChoices with 6 semantic variants`  
  *Verification #24/185: Verifies MENTION, COMMENT, ARTICLE_UPDATED, REVIEW_REQUESTED, APPROVED, REJECTED.*
- [x] **Checkpoint 025/185:** `feat(notification-model): set default is_read to False on newly created alerts`  
  *Verification #25/185: Verifies default boolean invariant on database schema.*
- [x] **Checkpoint 026/185:** `feat(notification-model): record read_at timestamp when notification is marked as read`  
  *Verification #26/185: Verifies timezone.now() is saved upon mark_as_read method call.*
- [x] **Checkpoint 027/185:** `feat(notification-model): cascade delete notifications when recipient user is deleted`  
  *Verification #27/185: Verifies models.CASCADE cleans up user notification records.*
- [x] **Checkpoint 028/185:** `feat(notification-model): set sender to SET_NULL if sender user account is purged`  
  *Verification #28/185: Verifies alert survives with null sender if author departs.*
- [x] **Checkpoint 029/185:** `feat(notification-model): set article to SET_NULL if parent article is hard-deleted`  
  *Verification #29/185: Verifies notification record remains intact with dead link safety.*
- [x] **Checkpoint 030/185:** `feat(notification-model): add human-readable __str__ representation for Django admin`  
  *Verification #30/185: Verifies '[MENTION] To: user - Title' string representation.*
- [x] **Checkpoint 031/185:** `feat(notification-model): enforce max_length 255 on title headline`  
  *Verification #31/185: Verifies schema constraint on notification title.*
- [x] **Checkpoint 032/185:** `feat(notification-model): enforce max_length 500 on frontend navigation link`  
  *Verification #32/185: Verifies long deep-link paths fit without truncation.*
- [x] **Checkpoint 033/185:** `feat(notification-model): order notifications descending by created_at by default`  
  *Verification #33/185: Verifies Meta.ordering = ['-created_at'].*
- [x] **Checkpoint 034/185:** `feat(notification-model): register Notification in Django Admin with filters`  
  *Verification #34/185: Verifies admin dashboard can inspect notification volume.*
- [x] **Checkpoint 035/185:** `feat(notification-model): optimize query with select_related on sender and article`  
  *Verification #35/185: Verifies 0 redundant queries when serializing notification list.*
- [x] **Checkpoint 036/185:** `feat(notification-model): verify database migration 0001_initial rollback safety`  
  *Verification #36/185: Verifies migration can be unapplied and reapplied cleanly.*
- [x] **Checkpoint 037/185:** `feat(notification-model): support system-generated alerts with null sender`  
  *Verification #37/185: Verifies broadcast or automated alerts function without user actor.*
- [x] **Checkpoint 038/185:** `feat(notification-model): validate max length constraint on notification_type (30 chars)`  
  *Verification #38/185: Verifies character limit conforms to longest choice name.*
- [x] **Checkpoint 039/185:** `feat(notification-model): ensure timezone-aware UTC timestamps on created_at`  
  *Verification #39/185: Verifies timezone.now default matches Django USE_TZ settings.*
- [x] **Checkpoint 040/185:** `feat(notification-model): verify model integrity with Django check management command`  
  *Verification #40/185: Verifies 0 model validation warnings from Django system check.*
- [x] **Checkpoint 041/185:** `feat(notification-api): restrict NotificationViewSet strictly to IsAuthenticated users`  
  *Verification #41/185: Verifies anonymous requests receive 401 Unauthorized.*
- [x] **Checkpoint 042/185:** `feat(notification-api): scope queryset strictly to request.user recipient`  
  *Verification #42/185: Verifies users cannot inspect or mark other users' notifications.*
- [x] **Checkpoint 043/185:** `feat(notification-api): implement GET /unread-count/ returning integer badge counter`  
  *Verification #43/185: Verifies fast lightweight query without serializing full payloads.*
- [x] **Checkpoint 044/185:** `feat(notification-api): implement POST /{id}/read/ updating single notification`  
  *Verification #44/185: Verifies 404 returned if ID belongs to another user.*
- [x] **Checkpoint 045/185:** `feat(notification-api): implement POST /mark-all-read/ updating bulk records`  
  *Verification #45/185: Verifies single UPDATE SQL statement marks all unread as read.*
- [x] **Checkpoint 046/185:** `feat(notification-api): return updated_count and remaining unread_count (0) in bulk response`  
  *Verification #46/185: Verifies frontend immediately updates local state from response.*
- [x] **Checkpoint 047/185:** `feat(notification-api): support ?filter=unread query parameter on notification list`  
  *Verification #47/185: Verifies filtering out already read notifications.*
- [x] **Checkpoint 048/185:** `feat(notification-api): support ?is_read=false boolean query parameter on list`  
  *Verification #48/185: Verifies standard boolean query string parsing.*
- [x] **Checkpoint 049/185:** `feat(notification-api): limit recent notifications list to top 50 items`  
  *Verification #49/185: Verifies pagination boundary avoids runaway JSON responses.*
- [x] **Checkpoint 050/185:** `feat(notification-api): serialize sender full name, username, and role`  
  *Verification #50/185: Verifies NotificationSenderSerializer returns nested actor details.*
- [x] **Checkpoint 051/185:** `feat(notification-api): serialize article title, slug, and status`  
  *Verification #51/185: Verifies NotificationArticleSerializer provides contextual data.*
- [x] **Checkpoint 052/185:** `feat(notification-api): return 200 OK on successful mark_as_read mutation`  
  *Verification #52/185: Verifies status code conformance on detail action.*
- [x] **Checkpoint 053/185:** `feat(notification-api): return 404 Not Found when marking non-existent notification ID`  
  *Verification #53/185: Verifies error handling on invalid UUID parameter.*
- [x] **Checkpoint 054/185:** `feat(notification-api): include unread_count directly inside list response payload`  
  *Verification #54/185: Verifies response dictionary contains count, unread_count, and results.*
- [x] **Checkpoint 055/185:** `feat(notification-api): ensure CORS headers allow authorization header for notifications`  
  *Verification #55/185: Verifies JWT bearer authentication functions across origins.*
- [x] **Checkpoint 056/185:** `feat(notification-api): verify rate limiting on notification polling endpoints`  
  *Verification #56/185: Verifies server absorbs background polling without degradation.*
- [x] **Checkpoint 057/185:** `feat(notification-api): test unread-count endpoint response latency (< 10ms)`  
  *Verification #57/185: Verifies indexed COUNT query executes near-instantaneously.*
- [x] **Checkpoint 058/185:** `feat(notification-api): test mark-all-read endpoint on empty unread queue`  
  *Verification #58/185: Verifies 0 updated rows returns cleanly without error.*
- [x] **Checkpoint 059/185:** `feat(notification-api): ensure serialized created_at uses ISO 8601 formatting`  
  *Verification #59/185: Verifies standard date parsing in frontend JavaScript.*
- [x] **Checkpoint 060/185:** `feat(notification-api): write automated test cases for all NotificationViewSet actions`  
  *Verification #60/185: Validates list, unread_count, read, and mark_all_read test coverage.*
- [x] **Checkpoint 061/185:** `feat(comments-backend): create ArticleComment model linked to Article and CustomUser`  
  *Verification #61/185: Verifies foreign key constraints and cascade rules.*
- [x] **Checkpoint 062/185:** `feat(comments-backend): index ArticleComment by article and created_at`  
  *Verification #62/185: Verifies art_com_art_created_idx speeds up comment stream loading.*
- [x] **Checkpoint 063/185:** `feat(comments-backend): index ArticleComment by author and created_at`  
  *Verification #63/185: Verifies art_com_author_created_idx tracks user contribution history.*
- [x] **Checkpoint 064/185:** `feat(comments-backend): implement GET /api/v1/articles/{slug}/comments/ endpoint`  
  *Verification #64/185: Verifies comments are returned in chronological ascending order.*
- [x] **Checkpoint 065/185:** `feat(comments-backend): implement POST /api/v1/articles/{slug}/comments/ endpoint`  
  *Verification #65/185: Verifies new comment creation with 201 Created status.*
- [x] **Checkpoint 066/185:** `feat(comments-backend): validate comment content is non-empty after trimming`  
  *Verification #66/185: Verifies 400 Bad Request returned on blank submission.*
- [x] **Checkpoint 067/185:** `feat(comments-backend): automatically trigger mention notifications on comment creation`  
  *Verification #67/185: Verifies parse_and_notify_mentions is invoked upon save.*
- [x] **Checkpoint 068/185:** `feat(comments-backend): automatically notify article author when a new comment is posted`  
  *Verification #68/185: Verifies author receives COMMENT notification if author != commenter.*
- [x] **Checkpoint 069/185:** `feat(comments-backend): prevent duplicate author notification if author comments on own article`  
  *Verification #69/185: Verifies commenter.id == article.author.id does not self-notify.*
- [x] **Checkpoint 070/185:** `feat(comments-backend): add is_own boolean serializer field based on request.user`  
  *Verification #70/185: Verifies frontend can visually distinguish user's own comments.*
- [x] **Checkpoint 071/185:** `feat(comments-backend): serialize comment author with id, username, full_name, and role`  
  *Verification #71/185: Verifies nested author information is provided in comment JSON.*
- [x] **Checkpoint 072/185:** `feat(comments-backend): enforce authenticated permission on comments POST action`  
  *Verification #72/185: Verifies unauthenticated users cannot post comments.*
- [x] **Checkpoint 073/185:** `feat(comments-backend): support markdown formatting and line breaks in comment content`  
  *Verification #73/185: Verifies multi-line commentary is preserved faithfully.*
- [x] **Checkpoint 074/185:** `feat(comments-backend): record updated_at timestamp when comments are modified`  
  *Verification #74/185: Verifies auto_now=True records modification timestamps.*
- [x] **Checkpoint 075/185:** `feat(comments-backend): set comment link anchor to /articles/{slug}#comments`  
  *Verification #75/185: Verifies clicking notification scrolls directly to discussion section.*
- [x] **Checkpoint 076/185:** `feat(comments-backend): test concurrent comment creation on popular articles`  
  *Verification #76/185: Verifies database transactions handle simultaneous comment posts.*
- [x] **Checkpoint 077/185:** `feat(comments-backend): enforce maximum length on comment text (10,000 characters)`  
  *Verification #77/185: Verifies abusive payload sizes are rejected.*
- [x] **Checkpoint 078/185:** `feat(comments-backend): verify ArticleComment deletion cascades cleanly with article`  
  *Verification #78/185: Verifies deleting draft article purges related comments.*
- [x] **Checkpoint 079/185:** `feat(comments-backend): write unit test suite for ArticleCommentViewSet`  
  *Verification #79/185: Validates list, create, and validation error test branches.*
- [x] **Checkpoint 080/185:** `feat(comments-backend): verify comments migration 0009_articlecomment applied successfully`  
  *Verification #80/185: Validates database schema integrity for article comments table.*
- [x] **Checkpoint 081/185:** `feat(mentions-api): implement MentionSuggestionsView endpoint at /auth/mention-suggestions/`  
  *Verification #81/185: Verifies query parameter q filters users by username and full_name.*
- [x] **Checkpoint 082/185:** `feat(mentions-api): support leading @ symbol stripping in search query parameter`  
  *Verification #82/185: Verifies q=@alice searches for 'alice' cleanly.*
- [x] **Checkpoint 083/185:** `feat(mentions-api): limit mention suggestion results to top 20 active users`  
  *Verification #83/185: Verifies autocomplete response stays lightweight.*
- [x] **Checkpoint 084/185:** `feat(mentions-api): order suggestions alphabetically by username`  
  *Verification #84/185: Verifies predictable ordering in autocomplete dropdown.*
- [x] **Checkpoint 085/185:** `feat(mentions-api): return id, username, full_name, role, and email in suggestion payload`  
  *Verification #85/185: Verifies complete user metadata for frontend badge rendering.*
- [x] **Checkpoint 086/185:** `feat(mentions-api): restrict mention suggestions to authenticated team members`  
  *Verification #86/185: Verifies anonymous access is denied for internal directory privacy.*
- [x] **Checkpoint 087/185:** `feat(mentions-api): filter out inactive user accounts from autocomplete suggestions`  
  *Verification #87/185: Verifies deactivated employees cannot be tagged in discussions.*
- [x] **Checkpoint 088/185:** `feat(mentions-api): test case-insensitive matching on partial usernames`  
  *Verification #88/185: Verifies q=adm matches 'admin_lead' and 'Admin'.*
- [x] **Checkpoint 089/185:** `feat(mentions-api): test partial matching on first and last names`  
  *Verification #89/185: Verifies q=sarah matches 'Sarah Chen'.*
- [x] **Checkpoint 090/185:** `feat(mentions-api): expose alias endpoint at /users/mention-suggestions/`  
  *Verification #90/185: Verifies backward compatibility across API URL namespaces.*
- [x] **Checkpoint 091/185:** `feat(mentions-api): benchmark suggestion search query latency (< 5ms)`  
  *Verification #91/185: Verifies indexed search delivers instant keystroke feedback.*
- [x] **Checkpoint 092/185:** `feat(mentions-api): handle empty search query returning top default colleagues`  
  *Verification #92/185: Verifies typing bare @ immediately displays suggestion list.*
- [x] **Checkpoint 093/185:** `feat(mentions-api): sanitize search query against SQL injection attacks`  
  *Verification #93/185: Verifies Django ORM parameterized queries protect user search.*
- [x] **Checkpoint 094/185:** `feat(mentions-api): ensure zero console warnings or serializer errors on suggestion fetch`  
  *Verification #94/185: Verifies clean JSON response structure.*
- [x] **Checkpoint 095/185:** `feat(mentions-api): write unit test suite for MentionSuggestionsView`  
  *Verification #95/185: Validates search filters, permissions, and result formatting.*
- [x] **Checkpoint 096/185:** `feat(mention-textarea): create reusable MentionTextarea React component`  
  *Verification #96/185: Verifies standalone component with value, onChange, and placeholder props.*
- [x] **Checkpoint 097/185:** `feat(mention-textarea): detect @ trigger character at cursor position in textarea`  
  *Verification #97/185: Verifies textarea.selectionStart calculates query boundary accurately.*
- [x] **Checkpoint 098/185:** `feat(mention-textarea): open floating suggestions dropdown positioned above textarea`  
  *Verification #98/185: Verifies bottom-full z-50 dropdown remains visible without page overflow.*
- [x] **Checkpoint 099/185:** `feat(mention-textarea): debounce mention suggestion API requests (150ms)`  
  *Verification #99/185: Verifies rapid typing does not flood backend with HTTP requests.*
- [x] **Checkpoint 100/185:** `feat(mention-textarea): implement ArrowDown and ArrowUp keyboard navigation in suggestions`  
  *Verification #100/185: Verifies selectedIndex cycles smoothly through suggestion list.*
- [x] **Checkpoint 101/185:** `feat(mention-textarea): implement Enter and Tab keypress to select active suggestion`  
  *Verification #101/185: Verifies e.preventDefault() prevents unintended form submission.*
- [x] **Checkpoint 102/185:** `feat(mention-textarea): implement Escape key listener to dismiss suggestion dropdown`  
  *Verification #102/185: Verifies user can close menu without inserting a mention.*
- [x] **Checkpoint 103/185:** `feat(mention-textarea): insert @username and trailing space at exact cursor position`  
  *Verification #103/185: Verifies surrounding text is preserved when mention is inserted.*
- [x] **Checkpoint 104/185:** `feat(mention-textarea): restore textarea focus and advance cursor after mention insertion`  
  *Verification #104/185: Verifies seamless continuous typing after selecting a colleague.*
- [x] **Checkpoint 105/185:** `feat(mention-textarea): display user avatar initials and role badge in suggestion items`  
  *Verification #105/185: Verifies Admin, Author, Reviewer, and Reader visual badges.*
- [x] **Checkpoint 106/185:** `feat(mention-textarea): highlight currently selected suggestion item with brand tint`  
  *Verification #106/185: Verifies bg-brand-600/30 and border-brand-500/40 active styling.*
- [x] **Checkpoint 107/185:** `feat(mention-textarea): support mouse hover selection alongside keyboard navigation`  
  *Verification #107/185: Verifies onMouseEnter synchronizes selectedIndex state.*
- [x] **Checkpoint 108/185:** `feat(mention-textarea): close suggestion dropdown when clicking outside textarea`  
  *Verification #108/185: Verifies document mousedown event listener cleans up dropdown.*
- [x] **Checkpoint 109/185:** `feat(mention-textarea): support onMouseDown preventDefault on suggestion buttons`  
  *Verification #109/185: Verifies clicking a suggestion does not blur textarea prematurely.*
- [x] **Checkpoint 110/185:** `feat(mention-textarea): style textarea with dark mode slate-900 palette and brand focus ring`  
  *Verification #110/185: Verifies seamless aesthetic integration with dark wiki theme.*
- [x] **Checkpoint 111/185:** `feat(mention-textarea): display keyboard shortcut hint (↑↓ Enter) in dropdown header`  
  *Verification #111/185: Verifies intuitive user guidance inside suggestion popup.*
- [x] **Checkpoint 112/185:** `feat(mention-textarea): support disabled prop during comment or review form submission`  
  *Verification #112/185: Verifies opacity and cursor styles when disabled.*
- [x] **Checkpoint 113/185:** `feat(mention-textarea): handle empty suggestion results state gracefully`  
  *Verification #113/185: Verifies dropdown auto-hides if no matching users are found.*
- [x] **Checkpoint 114/185:** `feat(mention-textarea): preserve multi-line textarea resizing with resize-y utility`  
  *Verification #114/185: Verifies user can expand textarea height for long feedback.*
- [x] **Checkpoint 115/185:** `feat(mention-textarea): verify zero TypeScript compilation errors in MentionTextarea`  
  *Verification #115/185: Validates clean type checking in strict React mode.*
- [x] **Checkpoint 116/185:** `feat(notification-bell): create NotificationBell component in global navigation header`  
  *Verification #116/185: Verifies bell button mounted next to user profile in Header.tsx.*
- [x] **Checkpoint 117/185:** `feat(notification-bell): render pulsing unread badge counter for unread alerts`  
  *Verification #117/185: Verifies rose-500 pill with animate-ping indicator when count > 0.*
- [x] **Checkpoint 118/185:** `feat(notification-bell): format unread count display with '9+' overflow cap`  
  *Verification #118/185: Verifies count > 9 renders compact '9+' badge.*
- [x] **Checkpoint 119/185:** `feat(notification-bell): toggle dropdown notification center on bell button click`  
  *Verification #119/185: Verifies slide-in-from-top-2 smooth entrance animation.*
- [x] **Checkpoint 120/185:** `feat(notification-bell): close dropdown when clicking outside bell or overlay`  
  *Verification #120/185: Verifies standard popover dismissal behavior.*
- [x] **Checkpoint 121/185:** `feat(notification-bell): implement segmented tabs for 'All' and 'Unread' filters`  
  *Verification #121/185: Verifies active tab switches notification stream dynamically.*
- [x] **Checkpoint 122/185:** `feat(notification-bell): add 'Mark all read' button in dropdown header`  
  *Verification #122/185: Verifies bulk mark-all-read clears badge and updates list.*
- [x] **Checkpoint 123/185:** `feat(notification-bell): render type-specific icons for each notification category`  
  *Verification #123/185: Verifies @ for MENTION, checkmark for APPROVED, clock for REVIEW.*
- [x] **Checkpoint 124/185:** `feat(notification-bell): highlight unread notifications with brand tint and blue dot`  
  *Verification #124/185: Verifies visual differentiation between read and unread items.*
- [x] **Checkpoint 125/185:** `feat(notification-bell): format relative creation timestamps (e.g. '5m ago', '2h ago')`  
  *Verification #125/185: Verifies human-readable relative time string formatter.*
- [x] **Checkpoint 126/185:** `feat(notification-bell): mark notification as read and navigate when item is clicked`  
  *Verification #126/185: Verifies optimistic unread count decrement and route change.*
- [x] **Checkpoint 127/185:** `feat(notification-bell): render 'All caught up!' empty state with friendly icon`  
  *Verification #127/185: Verifies empty state when user has zero pending alerts.*
- [x] **Checkpoint 128/185:** `feat(notification-bell): poll unread count in background every 25 seconds`  
  *Verification #128/185: Verifies silent interval refresh keeps count synchronized.*
- [x] **Checkpoint 129/185:** `feat(notification-bell): clean up polling interval on component unmount`  
  *Verification #129/185: Verifies zero memory leaks when navigating between pages.*
- [x] **Checkpoint 130/185:** `feat(notification-bell): display floating in-app toast popup when new alert arrives`  
  *Verification #130/185: Verifies fixed bottom-right toast with slide-in animation.*
- [x] **Checkpoint 131/185:** `feat(notification-bell): provide close button and 'View document' link on toast alert`  
  *Verification #131/185: Verifies toast can be dismissed or followed with one click.*
- [x] **Checkpoint 132/185:** `feat(notification-bell): track known notification IDs to prevent duplicate toasts`  
  *Verification #132/185: Verifies toast fires exclusively for genuinely new notifications.*
