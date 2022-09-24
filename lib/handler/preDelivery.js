"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const preDelivery = (event, context) => {
    // Add your own pre-delivery logic here
    // E.g. This could be an authentication handler
    if (false) {
        throw new Error("Pre delivery validation failed, error thrown");
    }
};
exports.default = preDelivery;
