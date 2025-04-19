import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'

export class TemplateService {
  private static instance: TemplateService
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map()

  private constructor() {
    this.registerPartials()
    this.registerLayouts()
  }

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService()
    }
    return TemplateService.instance
  }

  private registerPartials() {
    const partialsDir = path.join(
      process.cwd(),
      'server/email/templates/partials'
    )
    const files = fs.readdirSync(partialsDir)

    files.forEach((file) => {
      if (file.endsWith('.hbs')) {
        const name = path.basename(file, '.hbs')
        const template = fs.readFileSync(path.join(partialsDir, file), 'utf8')
        Handlebars.registerPartial(name, template)
      }
    })
  }

  private registerLayouts() {
    const layoutsDir = path.join(
      process.cwd(),
      'server/email/templates/layouts'
    )
    const files = fs.readdirSync(layoutsDir)

    files.forEach((file) => {
      if (file.endsWith('.hbs')) {
        const name = path.basename(file, '.hbs')
        const template = fs.readFileSync(path.join(layoutsDir, file), 'utf8')
        Handlebars.registerPartial(name, template)
      }
    })
  }

  public async getTemplate(
    templateName: string
  ): Promise<Handlebars.TemplateDelegate> {
    if (this.templates.has(templateName)) {
      return this.templates.get(templateName)!
    }

    const templatePath = path.join(
      process.cwd(),
      'server/email/templates/emails',
      `${templateName}.hbs`
    )
    const template = fs.readFileSync(templatePath, 'utf8')
    const compiledTemplate = Handlebars.compile(template)

    this.templates.set(templateName, compiledTemplate)
    return compiledTemplate
  }

  public async render(templateName: string, data: any): Promise<string> {
    const template = await this.getTemplate(templateName)
    return template(data)
  }
}
