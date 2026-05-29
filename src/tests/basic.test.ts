import {describe, expect, it} from "vitest";
/**
 * describe = groups related tests together, takes a string description and a function containing the tests
 * it = defines one specific test case, takes a string description and a function containing the test code
 * expect = checks whether the result is what was expected, takes a value and provides methods to compare it to expected values (e.g. expect(result).toBe(expectedValue))
 */


describe("basic test setup group of tests", () => {
    it("test case 1: should add two numbers correctly", () => {
        expect(1 + 2).toBe(3); //expect the result of 1 + 2 to be 3
    });

});