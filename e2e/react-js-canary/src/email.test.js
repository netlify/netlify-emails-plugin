describe("react-js canary", () => {
  it("successfully sends email request", async () => {
    const response = await fetch(
      `http://localhost:8888/.netlify/functions/emails/subscribed`,
      {
        headers: {
          "netlify-emails-secret": "ccfc35be-fc07-4ca0-aab6-8feab5867057",
          "Content-Type": "application/json",
          "canary-test": "true",
        },
        method: "POST",
        body: JSON.stringify({
          from: "lewis@reflr.io",
          to: "lewis@reflr.io",
          cc: "lewis.john.thorley@gmail.com",
          bcc: "lewis.john.thorley+test@gmail.com",
          subject: "Test 123",
          parameters: {
            people: ["Lewis", "Bob", "Alex"],
            name: "test",
            message: "t123",
          },
        }),
      }
    );

    const responseBody = await response.json();
    expect(response.status).toBe(200);
    expect(responseBody).toEqual(
      "Email sent successfully using sendgrid email API - CI Test"
    );
  });
});
