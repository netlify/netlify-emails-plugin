import { Context } from "@netlify/functions/dist/function/context";
import { Event } from "@netlify/functions/dist/function/event";

const preDelivery = (event: Event, context: Context) => {
  // Add your own pre-delivery logic here
  // E.g. This could be an authentication handler
  if (false) {
    throw new Error("Pre delivery validation failed, error thrown");
  }
};

export default preDelivery;
