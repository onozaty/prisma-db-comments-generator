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

  test("returns default configuration when no config provided", () => {
    // Arrange
    const generator = baseGenerator;
    const datasources = baseDatasources;

    // Act
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config).toEqual({
      targets: AllTargets,
      ignorePattern: undefined,
      ignoreCommentPattern: undefined,
      includeEnumInFieldComment: false,
      provider: "postgresql",
      outputDir: "/test/output",
    });
  });

  test("parses targets configuration correctly", () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        targets: ["table"],
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.targets).toEqual(["table"]);
  });

  test("parses multiple targets configuration correctly", () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        targets: ["table", "column"],
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.targets).toEqual(["table", "column"]);
  });

  test("creates ignorePattern RegExp from string", () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        ignorePattern: "^test_.*",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.ignorePattern).toBeInstanceOf(RegExp);
    expect(config.ignorePattern?.source).toBe("^test_.*");
    expect(config.ignorePattern?.test("test_table")).toBe(true);
    expect(config.ignorePattern?.test("other_table")).toBe(false);
  });

  test("creates ignoreCommentPattern RegExp from string", () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        ignoreCommentPattern: "deprecated|internal",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.ignoreCommentPattern).toBeInstanceOf(RegExp);
    expect(config.ignoreCommentPattern?.source).toBe("deprecated|internal");
    expect(config.ignoreCommentPattern?.test("deprecated comment")).toBe(true);
    expect(config.ignoreCommentPattern?.test("internal use")).toBe(true);
    expect(config.ignoreCommentPattern?.test("regular comment")).toBe(false);
  });

  test("parses includeEnumInFieldComment as true", () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        includeEnumInFieldComment: "true",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.includeEnumInFieldComment).toBe(true);
  });

  test("parses includeEnumInFieldComment as false for any non-true string", () => {
    // Arrange
    const generator = {
      ...baseGenerator,
      config: {
        includeEnumInFieldComment: "false",
      },
    };
    const datasources = baseDatasources;

    // Act
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.includeEnumInFieldComment).toBe(false);
  });

  test("defaults includeEnumInFieldComment to false when not provided", () => {
    // Arrange
    const generator = baseGenerator;
    const datasources = baseDatasources;

    // Act
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.includeEnumInFieldComment).toBe(false);
  });

  test("detects MySQL provider correctly", () => {
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
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.provider).toBe("mysql");
  });

  test("defaults to PostgreSQL provider when no datasources", () => {
    // Arrange
    const generator = baseGenerator;
    const datasources = baseDatasources;

    // Act
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.provider).toBe("postgresql");
  });

  test("defaults to PostgreSQL provider for non-MySQL datasources", () => {
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
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.provider).toBe("postgresql");
  });

  test("parses outputDir from generator output", () => {
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
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config.outputDir).toBe("/custom/output/path");
  });

  test("handles all configuration options together", () => {
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
    const config = readConfig({ generator, datasources });

    // Assert
    expect(config).toEqual({
      targets: ["column"],
      ignorePattern: expect.any(RegExp),
      ignoreCommentPattern: expect.any(RegExp),
      includeEnumInFieldComment: true,
      provider: "mysql",
      outputDir: "/custom/migrations",
    });
    expect(config.ignorePattern?.source).toBe("^temp_");
    expect(config.ignoreCommentPattern?.source).toBe("skip|ignore");
  });
});
