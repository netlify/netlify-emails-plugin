import { handler } from "./handler";

export const onPreBuild = async () => {
  // TODO - Make the plugin create an edge function, that calls the handler imported above
  // Current suggestion:
  // Step 1.
  // Update .toml of the project this plugin is used in to add definition for edge function to handle email requests
  // Step 2.
  // Start calling the edge function to see if it is reading the email templates
  // Step 3.
  // Update the handler function to actually call an email service like sendgrid or twilio to see if we can send emails
};
