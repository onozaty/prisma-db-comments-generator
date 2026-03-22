import { DataSource, GeneratorConfig } from "@prisma/generator-helper";
import { AllTargets } from "./comment";
import { readConfig } from "./config";

describe("readConfig", () => {
  const baseGenerator: GeneratorConfig = {
    name: "test-generator",
    provider: {
      fromEnvVar: null,
      value: "test-provider",
    },
    output: {
      fromEnvVar: null,
      value: "/test/output",
    },
    config: {},
    binaryTargets: [],
    previewFeatures: [],
    sourceFilePath: "/test/schema.prisma",
  };

  const baseDatasources: DataSource[] = [];

  test("returns default configuration when no config provided", async () => {
    // Arrange
    const generator = baseGenerator;
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config).toEqual({
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      commentRemovePattern: undefined,
      commentTransformFn: undefined,
      includeEnumInFieldComment: false,
      provider: "postgresql",
      outputDir: "/test/output",
    });
  });

  test("parses targets configuration correctly", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        targets: ["table"],
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.targets).toEqual(["table"]);
  });

  test("parses multiple targets configuration correctly", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        targets: ["table", "column"],
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.targets).toEqual(["table", "column"]);
  });

  test("creates ignorePattern RegExp from string", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        ignorePattern: "^test_.*",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.ignorePattern).toBeInstanceOf(RegExp);
    expect(config.ignorePattern?.source).toBe("^test_.*");
    expect(config.ignorePattern?.test("test_table")).toBe(true);
    expect(config.ignorePattern?.test("other_table")).toBe(false);
  });

  test("creates ignoreCommentPattern RegExp from string", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        ignoreCommentPattern: "deprecated|internal",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.ignoreCommentPattern).toBeInstanceOf(RegExp);
    expect(config.ignoreCommentPattern?.source).toBe("deprecated|internal");
    expect(config.ignoreCommentPattern?.test("deprecated comment")).toBe(true);
    expect(config.ignoreCommentPattern?.test("internal use")).toBe(true);
    expect(config.ignoreCommentPattern?.test("regular comment")).toBe(false);
  });

  test("parses includeEnumInFieldComment as true", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        includeEnumInFieldComment: "true",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.includeEnumInFieldComment).toBe(true);
  });

  test("parses includeEnumInFieldComment as false for any non-true string", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        includeEnumInFieldComment: "false",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.includeEnumInFieldComment).toBe(false);
  });

  test("defaults includeEnumInFieldComment to false when not provided", async () => {
    // Arrange
    const generator = baseGenerator;
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.includeEnumInFieldComment).toBe(false);
  });

  test("detects MySQL provider correctly", async () => {
    // Arrange
    const generator = baseGenerator;
    const datasources: DataSource[] = [
      {
        name: "db",
        provider: "mysql",
        activeProvider: "mysql",
        url: {
          fromEnvVar: null,
          value: "mysql://localhost:3306/test",
        },
        schemas: [],
        sourceFilePath: "/test/schema.prisma",
      },
    ];

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.provider).toBe("mysql");
  });

  test("defaults to PostgreSQL provider when no datasources", async () => {
    // Arrange
    const generator = baseGenerator;
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.provider).toBe("postgresql");
  });

  test("defaults to PostgreSQL provider for non-MySQL datasources", async () => {
    // Arrange
    const generator = baseGenerator;
    const datasources: DataSource[] = [
      {
        name: "db",
        provider: "postgresql",
        activeProvider: "postgresql",
        url: {
          fromEnvVar: null,
          value: "postgresql://localhost:5432/test",
        },
        schemas: [],
        sourceFilePath: "/test/schema.prisma",
      },
    ];

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.provider).toBe("postgresql");
  });

  test("parses outputDir from generator output", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      output: {
        fromEnvVar: null,
        value: "/custom/output/path",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.outputDir).toBe("/custom/output/path");
  });

  test("handles all configuration options together", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      output: {
        fromEnvVar: null,
        value: "/custom/migrations",
      },
      config: {
        targets: ["column"],
        ignorePattern: "^temp_",
        ignoreCommentPattern: "skip|ignore",
        includeEnumInFieldComment: "true",
      },
    };
    const datasources: DataSource[] = [
      {
        name: "db",
        provider: "mysql",
        activeProvider: "mysql",
        url: {
          fromEnvVar: null,
          value: "mysql://localhost:3306/test",
        },
        schemas: [],
        sourceFilePath: "/test/schema.prisma",
      },
    ];

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config).toEqual({
      targets: ["column"],
      ignorePattern: expect.any(RegExp),
      ignoreCommentPattern: expect.any(RegExp),
      commentRemovePattern: undefined,
      commentTransformFn: undefined,
      includeEnumInFieldComment: true,
      provider: "mysql",
      outputDir: "/custom/migrations",
    });
    expect(config.ignorePattern?.source).toBe("^temp_");
    expect(config.ignoreCommentPattern?.source).toBe("skip|ignore");
  });

  test("creates commentRemovePattern RegExp from string", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        commentRemovePattern: "@Description ",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.commentRemovePattern).toBeInstanceOf(RegExp);
    expect(config.commentRemovePattern?.source).toBe("@Description ");
    expect(
      "@Description User table".replace(config.commentRemovePattern!, ""),
    ).toBe("User table");
  });

  test("loads commentTransformFn from commentTransformScript", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      sourceFilePath: "/workspaces/prisma-db-comments-generator/schema.prisma",
      config: {
        commentTransformScript: "./src/__fixtures__/comment-transform.js",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.commentTransformFn).toBeInstanceOf(Function);
    expect(
      config.commentTransformFn!("hello", {
        type: "table",
        tableName: "users",
      }),
    ).toBe("[transformed] hello");
  });

  test("throws error when commentTransformScript file does not exist", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        commentTransformScript: "./nonexistent-transform.js",
      },
    };
    const datasources = baseDatasources;

    // Act & Assert
    await expect(readConfig({ generator, datasources })).rejects.toThrow(
      "Failed to load commentTransformScript: /test/nonexistent-transform.js",
    );
  });

  test("throws error when commentTransformScript does not export a function", async () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      sourceFilePath: "/workspaces/prisma-db-comments-generator/schema.prisma",
      config: {
        commentTransformScript: "./src/config.ts", // exists but doesn't export a default function
      },
    };
    const datasources = baseDatasources;

    // Act & Assert
    await expect(readConfig({ generator, datasources })).rejects.toThrow(
      "commentTransformScript must export a function",
    );
  });

  test("commentRemovePattern and commentTransformFn are undefined when not configured", async () => {
    // Arrange
    const generator = baseGenerator;
    const datasources = baseDatasources;

    // Act
    const config = await readConfig({ generator, datasources });

    // Assert
    expect(config.commentRemovePattern).toBeUndefined();
    expect(config.commentTransformFn).toBeUndefined();
  });
});
