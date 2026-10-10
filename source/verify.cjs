// Checks lesson integrity and runs the SQL answer keys against real SQLite.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

function loadTypeScript(file) {
  const source = fs.readFileSync(file, 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}
  }).outputText;
  const module = {exports: {}};
  vm.runInNewContext(js, {module, exports: module.exports});
  return module.exports;
}

const {chapters, sources} = loadTypeScript(__dirname + '/course.ts');
assert.equal(chapters.length, 21);
assert.equal(chapters.reduce((n, chapter) => n + chapter.exercises.length, 0), 63);
assert.equal(new Set(chapters.map(chapter => chapter.id)).size, 21);
for (const [index, chapter] of chapters.entries()) {
  assert.equal(chapter.id, index + 1, 'Chapter order');
  assert(chapter.sections.length >= 4 && chapter.sections.every(section => section.paragraphs.length >= 2), 'Detailed teaching sections');
  assert(chapter.goals.length >= 3 && chapter.cases.length >= 2 && chapter.example.lines.length >= 3);
  for (const reference of chapter.refs) assert(sources[reference], 'Missing reference ' + reference);
  for (const exercise of chapter.exercises) assert(exercise.prompt && exercise.why && exercise.hint, 'Exercise feedback/hints');
}

const initSqlJs = require('./vendor/sql-wasm.js');
(async () => {
  const SQL = await initSqlJs({wasmBinary: fs.readFileSync(__dirname + '/vendor/sql-wasm.wasm')});
  const app = fs.readFileSync(__dirname + '/app.ts', 'utf8');
  const seed = app.match(/const seedSql=`([^`]+)`/)[1];
  let sqlCount = 0;
  for (const chapter of chapters) for (const exercise of chapter.exercises) if (exercise.type === 'sql') {
    const db = new SQL.Database();
    db.run(seed);
    const output = db.exec(exercise.solution);
    const actual = exercise.check.kind === 'result' ? output.at(-1).values : db.exec(exercise.check.query)[0].values;
    assert.equal(JSON.stringify(actual), JSON.stringify(exercise.check.values), 'SQL answer in chapter ' + chapter.id);
    db.close();
    sqlCount++;
  }
  const db = new SQL.Database();
  db.run(seed);
  assert.throws(() => db.run("UPDATE inventory SET quantity=-1 WHERE user_id='A'"));
  assert.throws(() => db.run("INSERT INTO inventory VALUES('Z','wood',1)"));
  assert.throws(() => db.run("INSERT INTO inventory VALUES('A','wood',1)"));
  db.run('BEGIN;UPDATE inventory SET quantity=quantity-6 WHERE user_id=\'A\' AND item_id=\'wood\';ROLLBACK;');
  assert.equal(db.exec("SELECT quantity FROM inventory WHERE user_id='A' AND item_id='wood'")[0].values[0][0], 10);
  db.close();

  const html = fs.readFileSync(__dirname + '/../dist/index.html', 'utf8');
  assert(!/\/\*(?:COURSE_DATA|APP_CODE|SQL_ENGINE)\*\//.test(html), 'Build placeholders were replaced');
  assert(!/<script[^>]*\bsrc=|<link[^>]*rel=["']stylesheet/.test(html), 'No CDN required');
  console.log(`Verified: 21 chapters, 63 exercises, ${sqlCount} SQL keys, constraints and rollback, self-contained output.`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
