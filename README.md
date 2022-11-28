# Netlify Emails Plugin

🚧 Note: This plugin is pre-release software. Until version 1.0.0 is released, its API could change at any time.

The Netlify emails build plugin which is responsible for creating a serverless function to handle email requests, populating them with the provided templates and sending them using the specified email API provider.

## Docs

Full documentation for the Netlify Email Integration can be found [here](https://docs.netlify.com/netlify-labs/experimental-features/email-integration).

## Supported email providers

- Mailgun
- SendGrid
- Postmark

## Prerequisites

You must setup an account with one of our supported email providers listed above. You will also need to ensure your account is verified by the email provider and you have provided authorisation for emails to be sent from any email address you send from.

## Step 1: Enabling the Netlify Email Integration

Add it to your site via the Netlify app under Site Settings - (app.netlify.com/sites/{your-sitename}/settings/emails).

## Step 2: Configuration

When enabling the plugin via Site Settings, you should add the required configuration variables to complete the configuration step.

![image](https://user-images.githubusercontent.com/15314252/197204381-5a06d036-ea90-40d5-9a85-262d137e8309.png)

## Step 3: Adding Templates

Now that the setup is complete, you can create an email directory `./emails` (default) or use a custom directory, as long as you define it in your Email Settings under ‘Template directory’.

Each email template should be stored under a folder name that represents the route of your template and the email file should be named `index.html`. E.g. `./emails/welcome/index.html`.

If there are variables that need replacing in your email template when the email is triggered, please use the [handlebars.js](https://handlebarsjs.com/) syntax and pass the arguments in the request as shown in Step 5 below.

Sample email with parameters:

```
<html>
  <body>
    <h1>Welcome, {{name}}</h1>
    <p>We hope you enjoy our super simple emails!</p>
  </body>
</html>
```

## Step 4: Previewing emails locally

Visit `http://localhost:{PORT}/.netlify/functions/emails/_preview` to preview your email templates.

Please note, this preview endpoint is not made available in production and is only made available locally.

## Step 5: Triggering an Email

Dependent on where you would like to trigger an email being sent (on a subscribe or data request button click, when an event is triggered, etc.), add this snippet to your code that is reacting to that event.

```
 import fetch from 'node-fetch'

 await fetch(
    `${process.env.URL}/.netlify/functions/emails/welcome`,
    {
      headers: {
        "netlify-emails-secret": process.env.NETLIFY_EMAILS_SECRET,
      },
      method: "POST",
      body: JSON.stringify({
        from: "no-reply@yourdomain.com",
        to: "alexanderhamilton@test.com",
        cc: "cc@test.com",
        bcc: "bcc@test.com",
        subject: "Welcome",
        parameters: {
          products: ["product1", "product2", "product3"],
          name: "Alexander",
        },
      }),
    }
  );
```

You can also trigger the email locally by running `netlify build`, then `netlify dev` and making the above request.
