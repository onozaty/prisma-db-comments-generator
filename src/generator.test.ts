import * as child_process from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const fixturesDir = path.join(__dirname, "__fixtures__");

beforeAll(() => {
  // テスト開始時にビルドしておく
  child_process.execSync(`pnpm run build`);
});

beforeEach(() => {
  child_process.execSync(
    `find ${fixturesDir} -name "migrations" -type d -prune -exec rm -rf {} \\;`,
  );
});

test("basic", async () => {
  // Arrange
  const name = "basic";

  // Act
  executeGenerate(name);

  // Assert
  const migrationSqlContent = readMigrationSql(name);
  expect(migrationSqlContent).toMatchSnapshot("migration.sql");

  const commentsLatestJsonContent = readCommentsLatestJson(name);
  expect(commentsLatestJsonContent).toMatchSnapshot("comments-latest.json");
});

test("target-column", async () => {
  // Arrange
  const name = "target-column";

  // Act
  executeGenerate(name);

  // Assert
  const migrationSqlContent = readMigrationSql(name);
  expect(migrationSqlContent).toMatchSnapshot("migration.sql");

  const commentsLatestJsonContent = readCommentsLatestJson(name);
  expect(commentsLatestJsonContent).toMatchSnapshot("comments-latest.json");
});

test("target-table", async () => {
  // Arrange
  const name = "target-table";

  // Act
  executeGenerate(name);

  // Assert
  const migrationSqlContent = readMigrationSql(name);
  expect(migrationSqlContent).toMatchSnapshot("migration.sql");

  const commentsLatestJsonContent = readCommentsLatestJson(name);
  expect(commentsLatestJsonContent).toMatchSnapshot("comments-latest.json");
});

test("diff", async () => {
  // Arrange
  // diff1のマイグレーションをベースに、diff2のマイグレーションを生成して差分となること
  executeGenerate("diff1");
  fs.cpSync(getMigrationsDir("diff1"), getMigrationsDir("diff2"), {
    recursive: true,
  });

  const name = "diff2";

  // Act
  executeGenerate(name);

  // Assert
  const migrationSqlContent = readMigrationSql(name);
  expect(migrationSqlContent).toMatchSnapshot("migration.sql");

  const commentsLatestJsonContent = readCommentsLatestJson(name);
  expect(commentsLatestJsonContent).toMatchSnapshot("comments-latest.json");
});

test("multi-schema", async () => {
  // Arrange
  const name = "multi-schema";

  // Act
  executeGenerate(name);

  // Assert
  const migrationSqlContent = readMigrationSql(name);
  expect(migrationSqlContent).toMatchSnapshot("migration.sql");

  const commentsLatestJsonContent = readCommentsLatestJson(name);
  expect(commentsLatestJsonContent).toMatchSnapshot("comments-latest.json");
});

test("mysql", async () => {
  // Arrange
  const name = "mysql";

  // Act
  executeGenerate(name);

  // Assert
  const migrationSqlContent = readMigrationSql(name);
  expect(migrationSqlContent).toMatchSnapshot("migration.sql");

  const commentsLatestJsonContent = readCommentsLatestJson(name);
  expect(commentsLatestJsonContent).toMatchSnapshot("comments-latest.json");
});

const executeGenerate = (name: string) => {
  const schemaPath = path.join(fixturesDir, name, "schema.prisma");
  child_process.execSync(`npx prisma generate --schema ${schemaPath}`);
};

const readCommentsLatestJson = (name: string): string => {
  const migrationsDir = getMigrationsDir(name);
  const commentLatestJsonPath = path.join(
    migrationsDir,
    "comments-latest.json",
  );

  return fs.readFileSync(commentLatestJsonPath, "utf-8");
};

const readMigrationSql = (name: string): string => {
  const migrationsDir = getMigrationsDir(name);
  const latestDirName = fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort()
    .reverse()[0];

  if (!latestDirName) {
    throw new Error("No migration directories found");
  }

  const migrationSqlPath = path.join(
    migrationsDir,
    latestDirName,
    "migration.sql",
  );

  const contents = fs.readFileSync(migrationSqlPath, "utf-8");

  // Remove version-dependent parts (e.g., "-- Prisma Database Comments Generator vX.Y.Z") from the migration SQL content.
  return contents.replace(
    /-- Prisma Database Comments Generator v[0-9]+\.[0-9]+\.[0-9]+\n/,
    "",
  );
};

const getMigrationsDir = (name: string) => {
  return path.join(fixturesDir, name, "migrations");
};
