interface IEmailRequest {
    from: string;
    to: string;
    subject: string;
    html: string;
}
interface IEmailConfig {
    apiKey: string;
    mailgunDomain?: string;
}
interface IMailerProps {
    configuration: IEmailConfig;
    request: IEmailRequest;
}
declare const mailer: ({ configuration, request, }: IMailerProps) => Promise<{
    status: number;
    body: string;
}>;
export default mailer;
