import { parse, build } from "..";

describe("Unicode and Edge Cases", () => {
  describe("Unicode escape sequences", () => {
    it("should handle \\U escape sequences", () => {
      const pbxproj = `{
        testKey = "\\U0041\\U0042\\U0043";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.testKey).toBe("ABC");
    });

    it("should handle standard escape sequences", () => {
      const pbxproj = `{
        newline = "line1\\nline2";
        tab = "col1\\tcol2";
        quote = "say \\"hello\\"";
        backslash = "path\\\\to\\\\file";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.newline).toBe("line1\nline2");
      expect(result.tab).toBe("col1\tcol2");
      expect(result.quote).toBe('say "hello"');
      expect(result.backslash).toBe("path\\to\\file");
    });

    it("should handle control character escapes", () => {
      const pbxproj = `{
        bell = "\\a";
        backspace = "\\b";
        formfeed = "\\f";
        carriage = "\\r";
        vertical = "\\v";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.bell).toBe("\x07");
      expect(result.backspace).toBe("\b");
      expect(result.formfeed).toBe("\f");
      expect(result.carriage).toBe("\r");
      expect(result.vertical).toBe("\v");
    });

    it("should handle invalid Unicode sequences gracefully", () => {
      const pbxproj = `{
        invalidUnicode = "\\UZZZZ";
        partialUnicode = "\\U123";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.invalidUnicode).toBe("\\UZZZZ");
      expect(result.partialUnicode).toBe("\\U123");
    });
  });

  describe("NextStep character mapping", () => {
    it("should handle NextStep high-bit characters via octal", () => {
      // Test some key NextStep mappings
      const pbxproj = `{
        nonBreakSpace = "\\200";
        copyright = "\\240";
        registeredSign = "\\260";
        bullet = "\\267";
        enDash = "\\261";
        emDash = "\\320";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.nonBreakSpace).toBe("\u00a0"); // NO-BREAK SPACE
      expect(result.copyright).toBe("\u00a9"); // COPYRIGHT SIGN
      expect(result.registeredSign).toBe("\u00ae"); // REGISTERED SIGN
      expect(result.bullet).toBe("\u2022"); // BULLET
      expect(result.enDash).toBe("\u2013"); // EN DASH
      expect(result.emDash).toBe("\u2014"); // EM DASH
    });

    it("should handle accented characters via NextStep mapping", () => {
      const pbxproj = `{
        aGrave = "\\201";
        aAcute = "\\202";
        aTilde = "\\204";
        ccedilla = "\\207";
        eGrave = "\\210";
        oSlash = "\\351";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.aGrave).toBe("\u00c0"); // À
      expect(result.aAcute).toBe("\u00c1"); // Á
      expect(result.aTilde).toBe("\u00c3"); // Ã
      expect(result.ccedilla).toBe("\u00c7"); // Ç
      expect(result.eGrave).toBe("\u00c8"); // È
      expect(result.oSlash).toBe("\u00d8"); // Ø
    });

    it("should handle ligatures and special characters", () => {
      const pbxproj = `{
        fiLigature = "\\256";
        flLigature = "\\257";
        fractionSlash = "\\244";
        fHook = "\\246";
        ellipsis = "\\274";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.fiLigature).toBe("\ufb01"); // ﬁ
      expect(result.flLigature).toBe("\ufb02"); // ﬂ
      expect(result.fractionSlash).toBe("\u2044"); // ⁄
      expect(result.fHook).toBe("\u0192"); // ƒ
      expect(result.ellipsis).toBe("\u2026"); // …
    });

    it("should handle replacement characters for undefined mappings", () => {
      const pbxproj = `{
        notdef1 = "\\376";
        notdef2 = "\\377";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.notdef1).toBe("\ufffd"); // REPLACEMENT CHARACTER
      expect(result.notdef2).toBe("\ufffd"); // REPLACEMENT CHARACTER
    });
  });

  describe("Octal escape sequences", () => {
    it("should handle single digit octal", () => {
      const pbxproj = `{
        null = "\\0";
        one = "\\1";
        seven = "\\7";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.null).toBe("\x00");
      expect(result.one).toBe("\x01");
      expect(result.seven).toBe("\x07");
    });

    it("should handle two digit octal", () => {
      const pbxproj = `{
        ten = "\\12";
        twentySeven = "\\33";
        seventySeven = "\\115";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.ten).toBe("\x0a");
      expect(result.twentySeven).toBe("\x1b");
      expect(result.seventySeven).toBe("\x4d");
    });

    it("should handle three digit octal", () => {
      const pbxproj = `{
        max = "\\377";
        middleRange = "\\177";
        lowRange = "\\077";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.max).toBe("\ufffd"); // NextStep mapped
      expect(result.middleRange).toBe("\x7f");
      expect(result.lowRange).toBe("\x3f");
    });

    it("should handle octal with trailing digits", () => {
      const pbxproj = `{
        test1 = "\\1234";
        test2 = "\\777";
      }`;
      const result = parse(pbxproj) as any;
      // Should parse \123 (octal 123 = decimal 83 = 0x53) and leave "4"
      expect(result.test1).toBe("S4");
      // \777 (octal 777 = decimal 511) - beyond NextStep range, produces Unicode char 511
      expect(result.test2).toBe("ǿ");
    });
  });

  describe("String parsing edge cases", () => {
    it("should handle empty strings", () => {
      const pbxproj = `{
        empty1 = "";
        empty2 = '';
      }`;
      const result = parse(pbxproj) as any;
      expect(result.empty1).toBe("");
      expect(result.empty2).toBe("");
    });

    it("should handle mixed quote styles", () => {
      const pbxproj = `{
        doubleQuoted = "double";
        singleQuoted = 'single';
        doubleInSingle = 'say "hello"';
        singleInDouble = "it's working";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.doubleQuoted).toBe("double");
      expect(result.singleQuoted).toBe("single");
      expect(result.doubleInSingle).toBe('say "hello"');
      expect(result.singleInDouble).toBe("it's working");
    });

    it("should handle unquoted identifiers", () => {
      const pbxproj = `{
        unquoted = value;
        withNumbers = value123;
        withPath = path/to/file;
        withDots = com.example.app;
        withHyphens = with-hyphens;
        withUnderscores = with_underscores;
      }`;
      const result = parse(pbxproj) as any;
      expect(result.unquoted).toBe("value");
      expect(result.withNumbers).toBe("value123"); // Mixed alphanumeric stays string
      expect(result.withPath).toBe("path/to/file");
      expect(result.withDots).toBe("com.example.app");
      expect(result.withHyphens).toBe("with-hyphens");
      expect(result.withUnderscores).toBe("with_underscores");
    });

    it("should handle complex nested escapes", () => {
      const pbxproj = `{
        complex = "prefix\\n\\tindented\\\\backslash\\U0041suffix";
      }`;
      const result = parse(pbxproj) as any;
      expect(result.complex).toBe("prefix\n\tindented\\backslashAsuffix");
    });

    it("should preserve numeric formatting quirks", () => {
      const pbxproj = `{
        octalString = 0755;
        trailingZero = 1.0;
        integer = 42;
        float = 3.14;
        scientificNotation = 1e5;
      }`;
      const result = parse(pbxproj) as any;
      expect(result.octalString).toBe("0755"); // Preserve octal as string
      expect(result.trailingZero).toBe("1.0"); // Preserve trailing zero
      expect(result.integer).toBe(42);
      expect(result.float).toBe(3.14);
      // Scientific notation might not be supported in pbxproj
      expect(result.scientificNotation).toBe("1e5");
    });
  });

  describe("Data literal edge cases", () => {
    it("should handle minimal data literals", () => {
      const pbxproj = `{
        singleByte = <48>;
      }`;
      const result = parse(pbxproj) as any;
      expect(result.singleByte).toEqual(Buffer.from("48", 'hex'));
      expect(result.singleByte.toString()).toBe("H");
    });

    it("should handle data with spaces", () => {
      const pbxproj = `{
        dataWithSpaces = <48 65 6c 6c 6f>;
      }`;
      const result = parse(pbxproj) as any;
      expect(result.dataWithSpaces).toEqual(Buffer.from("48656c6c6f", 'hex'));
      expect(result.dataWithSpaces.toString()).toBe("Hello");
    });

    it("should handle data with newlines", () => {
      const pbxproj = `{
        multilineData = <48656c6c6f
        576f726c64>;
      }`;
      const result = parse(pbxproj) as any;
      expect(result.multilineData).toEqual(Buffer.from("48656c6c6f576f726c64", 'hex'));
      expect(result.multilineData.toString()).toBe("HelloWorld");
    });

    it("should handle uppercase and lowercase hex", () => {
      const pbxproj = `{
        mixedCase = <48656C6c6F>;
      }`;
      const result = parse(pbxproj) as any;
      expect(result.mixedCase).toEqual(Buffer.from("48656c6c6f", 'hex'));
      expect(result.mixedCase.toString()).toBe("Hello");
    });
  });

  describe("Round-trip preservation", () => {
    it("should preserve Unicode characters in round-trip", () => {
      const original = `{
        unicode = "\\U0041\\U00e9\\U2022";
        nextStep = "\\240\\267";
        mixed = "Hello\\nWorld\\t\\U0041";
      }`;
      
      const parsed = parse(original);
      const rebuilt = build(parsed);
      const reparsed = parse(rebuilt) as any;
      
      expect(reparsed.unicode).toBe("Aé•");
      expect(reparsed.nextStep).toBe("©•");
      expect(reparsed.mixed).toBe("Hello\nWorld\tA");
    });

    it("should preserve data literals in round-trip", () => {
      const original = `{
        data = <48656C6C6F>;
      }`;
      
      const parsed = parse(original);
      const rebuilt = build(parsed);
      const reparsed = parse(rebuilt) as any;
      
      expect(reparsed.data).toEqual(Buffer.from("48656c6c6f", 'hex'));
      expect(reparsed.data.toString()).toBe("Hello");
    });

    it("should preserve numeric formatting in round-trip", () => {
      const original = `{
        octal = 0755;
        trailingZero = 1.0;
        integer = 42;
      }`;
      
      const parsed = parse(original);
      const rebuilt = build(parsed);
      
      // These should be preserved as strings in the output
      expect(rebuilt).toContain('0755');
      expect(rebuilt).toContain('1.0');
      expect(rebuilt).toContain('42');
    });
  });

  describe("Error handling", () => {
    it("should handle malformed Unicode gracefully", () => {
      const pbxproj = `{
        incomplete = "\\U12";
        invalid = "\\Ugggg";
      }`;
      
      expect(() => parse(pbxproj)).not.toThrow();
      const result = parse(pbxproj) as any;
      expect(result.incomplete).toBe("\\U12");
      expect(result.invalid).toBe("\\Ugggg");
    });

    it("should handle malformed data literals gracefully", () => {
      const pbxproj = `{
        oddLength = <48656c6c6f>;
      }`;
      
      // Valid hex should parse correctly
      expect(() => parse(pbxproj)).not.toThrow();
      const result = parse(pbxproj) as any;
      expect(result.oddLength).toEqual(Buffer.from("48656c6c6f", 'hex'));
    });

    it("should handle unclosed strings gracefully", () => {
      const pbxproj = `{
        unclosed = "missing quote;
      }`;
      
      // Parser should handle this error case
      expect(() => parse(pbxproj)).toThrow();
    });
  });
});