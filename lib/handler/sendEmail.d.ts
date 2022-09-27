declare const sendEmail: ({ template, to, from, subject, parameters, }: {
    template: string;
    to: string;
    from: string;
    subject: string;
    parameters: object;
    token: string;
}) => void;
export default sendEmail;
