export default function PrivacyPolicyPage() {
  return (
    <div className="container py-12 max-w-3xl mx-auto space-y-8">
      <div className="space-y-4 border-b pb-8">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
      <div className="prose prose-invert max-w-none space-y-6 text-foreground/90">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
          <p>We collect information you provide directly to us, such as your name, email address, fitness goals, dietary preferences, and any biometric data (height, weight) you choose to log in the PostureSense app.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>We use the collected data to personalize your AI Coach experience, generate custom workout plans, and track your progress over time. We do not sell your personal health data to third-party advertisers.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">3. Community and Blogs</h2>
          <p>Any content you post to the Community Feed or Blogs section is public to other authenticated users of the platform, unless you explicitly use the "Post Anonymously" feature. Even then, your post content remains visible to users on the platform.</p>
        </section>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">4. Data Security</h2>
          <p>We implement industry-standard security measures, including Google Firebase authentication and encrypted Firestore databases, to protect your data from unauthorized access.</p>
        </section>
      </div>
    </div>
  );
}
