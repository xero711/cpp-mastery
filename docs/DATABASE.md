# Data model

## Current browser-local model

The static GitHub Pages build has no server database. IndexedDB stores a versioned record for one browser profile:

- `settings`: learning start date, study days, daily target, and theme. The optional runner URL is either a build-time public setting or a browser-local override; it is kept outside learner backups.
- `lessons`: lesson ID, draft code, quiz/debug answers, completion state, and timestamps.
- `submissions`: source snapshot, runner status, compiler result, program output, tests, and timestamp.
- `projects`: learner-authored project notes and status.
- `portfolio`: learner-authored entries.
- `mentor-conversations`: up to 200 local user/assistant messages, mode, timestamp, and provider token-usage/cost evidence. These messages are included in explicit JSON backups; service tokens remain in the separate `private-secrets` object store and are never exported.

The AI endpoint URL override is browser-local and is not part of learner backups. Provider keys are not browser settings; they are read only from the separate mentor service environment.

Content definitions and versions are bundled separately from progress. Import validates the export version and data shape before replacing local state. Export is a JSON snapshot that learners can copy between browsers manually. There is no automatic cloud sync.

## Planned server model

If multi-user use is introduced, move progress and settings into PostgreSQL with stable user IDs. Version lesson and exercise definitions, keep test cases immutable per exercise version, and preserve submission evidence so old grades can be reproduced. Add user, settings, curriculum, lesson/version, skill/prerequisite, exercise/version/test case, submission/result, learning session/progress, review schedule/attempt, project/milestone, portfolio entry, and audit entities. Require authenticated authorization and explicit export/delete workflows.
