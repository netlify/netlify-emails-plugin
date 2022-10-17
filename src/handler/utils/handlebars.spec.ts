import { getHBValues } from "./handlebars";

describe("Handlerbars utils", () => {
  describe("getHbValues function", () => {
    it("should return variable expressions", () => {
      const values = getHBValues("<html><p>{{name}}</p></html>");

      expect(values).toEqual({ name: "" });
    });

    it("should return path expressions", () => {
      const values = getHBValues(
        "<html><p>{{person.firstname}} {{person.lastname}}</p></html>"
      );

      expect(values).toEqual({ person: { firstname: "", lastname: "" } });
    });

    it("should return array expressions", () => {
      const values = getHBValues(
        "<html><p>{{#each people}}<li>{{this}}</li>{{/each}}</p></html>"
      );

      expect(values).toEqual({ people: expect.any(Array) });
    });
  });
});
