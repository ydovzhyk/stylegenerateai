import { Mail, MessageCircle, Sparkles } from 'lucide-react'
import ContactForm from './ContactForm'
import Text from '@/components/shared/text/Text'

export default function ContactSection() {
  return (
    <section id="contact" className="flex flex-col gap-8">
      <div className="max-w-3xl">
        <Text
          as="h2"
          variant="h1"
          color="white"
          caseMode="sentence"
          className="max-w-[92%] sm:max-w-none"
        >
          Let’s Talk
        </Text>

        <Text
          as="p"
          variant="body"
          color="muted"
          caseMode="sentence"
          className="mt-3 max-w-2xl text-sm leading-6 sm:text-base"
        >
          Have a question, idea, or custom AI image request? Send a message and
          we’ll get back to you.
        </Text>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-stretch">
        <ContactForm />

        <div className="gradient-border-card relative h-full p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-row gap-4">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary-soft">
                <Sparkles size={20} />
              </span>

              <Text
                as="h3"
                variant="h3"
                color="white"
                caseMode="sentence"
                className="text-lg"
              >
                Custom AI image requests
              </Text>
            </div>

            <Text
              as="p"
              variant="body"
              color="muted"
              caseMode="sentence"
              className="mt-2 text-sm leading-6"
            >
              Need a specific style, professional portrait flow, photo
              enhancement, or custom visual feature? Tell us what you want to
              create.
            </Text>

            <div className="grid gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-2 flex items-center gap-3 text-primary-soft">
                  <Mail size={18} />
                  <Text as="p" variant="caption" caseMode="title">
                    Email
                  </Text>
                </div>

                <a
                  href="mailto:stylegenerateai@gmail.com"
                  className="text-m text-foreground-muted transition hover:text-white"
                >
                  stylegenerateai@gmail.com
                </a>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                <div className="mb-2 flex items-center gap-3 text-cyan-300">
                  <MessageCircle size={18} />
                  <Text as="p" variant="caption" caseMode="title">
                    Response
                  </Text>
                </div>

                <Text
                  as="p"
                  variant="body"
                  color="muted"
                  caseMode="sentence"
                  className="text-sm leading-6"
                >
                  We usually review messages as soon as possible and reply with
                  the next steps.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
