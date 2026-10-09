# Curriculum

The canonical dataset contains 104 weeks × 7 day slots = 728 daily learning slots. Day 1 introduces a concept, Days 2–3 implement and apply it, Day 4 reads and repairs code, Day 5 emphasizes design, Day 6 integrates the week, and Day 7 reviews and assesses. Individual weeks may change this rhythm when their topic needs it.

The eight 13-week phases and all weekly topics are implemented in `src/lib/curriculum.ts`. Week goals and outcomes are tracked separately from learner progress. A week is never marked complete from a calendar calculation.

Weeks 1–7 have authored daily lesson records in `src/lib/lessons.ts` and the `src/lib/lesson-seeds/week-*.ts` files; later weeks currently provide the complete weekly curriculum plan but need lesson authoring and validation before they can be treated as full courses. Before publication, validate every example with a real compiler and every expected output against the example program.

See the original phase descriptions in the implementation data for C++ foundations, modern C++, advanced language features, low-level quality, CS/math/algorithms, game technology, professional practice, and advanced practice/career preparation.
