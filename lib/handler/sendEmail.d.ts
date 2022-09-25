declare const sendEmail: ({ template, to, from, subject, parameters, }: {
    template: string;
    to: string;
    from: string;
    subject: string;
    parameters: object;
}) => void;
export default sendEmail;
