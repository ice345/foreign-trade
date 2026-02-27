type SmsProvider = {
  send: (phone: string, message: string) => Promise<void>
}

// 阻止 webpack 静态分析 require
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
const dynamicRequire = new Function("mod", "return require(mod)") as (mod: string) => unknown

function extractCode(message: string): string {
  const match = message.match(/(\d{6})/)
  return match ? match[1] : message
}

// ─── Stub (开发模式，仅打印日志) ───
const stubProvider: SmsProvider = {
  send: async (phone, message) => {
    console.info(`[Dev SMS] To: ${phone} | Message: ${message}`)
  }
}

// ─── 阿里云短信 ───
// 安装: pnpm add @alicloud/dysmsapi20170525 @alicloud/openapi-client
// Env: ALIYUN_SMS_ACCESS_KEY_ID, ALIYUN_SMS_ACCESS_KEY_SECRET,
//      ALIYUN_SMS_SIGN_NAME, ALIYUN_SMS_TEMPLATE_CODE
const aliyunProvider: SmsProvider = {
  send: async (phone, message) => {
    const China = dynamicRequire("@alicloud/dysmsapi20170525") as Record<string, unknown>
    const OpenApi = dynamicRequire("@alicloud/openapi-client") as Record<string, unknown>

    const ConfigClass = OpenApi.Config as new (opts: Record<string, unknown>) => unknown
    const config = new ConfigClass({
      accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
      endpoint: "dysmsapi.aliyuncs.com"
    })

    const DefaultClient = (China.default ?? China) as new (cfg: unknown) => { sendSms: (req: unknown) => Promise<unknown> }
    const client = new DefaultClient(config)

    const SendSmsRequest = China.SendSmsRequest as new (opts: Record<string, unknown>) => unknown
    const code = extractCode(message)

    await client.sendSms(new SendSmsRequest({
      phoneNumbers: phone,
      signName: process.env.ALIYUN_SMS_SIGN_NAME,
      templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code })
    }))
  }
}

// ─── 腾讯云短信 ───
// 安装: pnpm add tencentcloud-sdk-nodejs
// Env: TENCENT_SMS_SECRET_ID, TENCENT_SMS_SECRET_KEY,
//      TENCENT_SMS_SDK_APP_ID, TENCENT_SMS_SIGN_NAME, TENCENT_SMS_TEMPLATE_ID
const tencentProvider: SmsProvider = {
  send: async (phone, message) => {
    const tencentcloud = dynamicRequire("tencentcloud-sdk-nodejs") as {
      sms: { v20210111: { Client: new (opts: Record<string, unknown>) => { SendSms: (params: Record<string, unknown>) => Promise<unknown> } } }
    }
    const SmsClient = tencentcloud.sms.v20210111.Client

    const client = new SmsClient({
      credential: {
        secretId: process.env.TENCENT_SMS_SECRET_ID,
        secretKey: process.env.TENCENT_SMS_SECRET_KEY
      },
      region: "ap-guangzhou"
    })

    const code = extractCode(message)
    const formattedPhone = phone.startsWith("+") ? phone : `+86${phone}`

    await client.SendSms({
      SmsSdkAppId: process.env.TENCENT_SMS_SDK_APP_ID,
      SignName: process.env.TENCENT_SMS_SIGN_NAME,
      TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID,
      TemplateParamSet: [code],
      PhoneNumberSet: [formattedPhone]
    })
  }
}

// ─── Provider 选择（通过 SMS_PROVIDER 环境变量切换） ───
function getProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER ?? "stub"

  switch (provider) {
    case "aliyun":
      return aliyunProvider
    case "tencent":
      return tencentProvider
    default:
      return stubProvider
  }
}

export async function sendSMS(phone: string, message: string) {
  const provider = getProvider()
  await provider.send(phone, message)
}
