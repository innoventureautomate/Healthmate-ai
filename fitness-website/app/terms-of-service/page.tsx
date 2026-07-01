export default function TermsOfServicePage() {
  return (
    <div className="container py-12 max-w-3xl mx-auto space-y-8">
      <div className="space-y-4 border-b pb-8">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
      <div className="prose prose-invert max-w-none space-y-6 text-foreground/90">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
          <p>By accessing and using PostureSense, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">2. Medical Disclaimer</h2>
          <p>PostureSense is an AI-powered fitness tracking tool, not a medical provider. The workout plans, nutritional advice, and chatbot responses provided by this app are for informational purposes only and should not replace professional medical advice, diagnosis, or treatment.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">3. User Conduct</h2>
          <p>Users are expected to maintain a respectful environment in the Community Feed and Blogs. Harassment, hate speech, spam, and inappropriate content will result in immediate account termination.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">4. Modifications</h2>
          <p>We reserve the right to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect.</p>
        </section>
      </div>
    </div>
  );
}
