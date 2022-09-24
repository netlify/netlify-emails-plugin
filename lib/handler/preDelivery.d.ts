import { Context } from "@netlify/functions/dist/function/context";
import { Event } from "@netlify/functions/dist/function/event";
declare const preDelivery: (event: Event, context: Context) => void;
export default preDelivery;
