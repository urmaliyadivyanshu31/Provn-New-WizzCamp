"use client"

import React from "react"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ShieldCheckIcon, DocumentTextIcon } from "@/components/icons"
import Link from "next/link"

export default function PrivacyPolicy() {
  // Provn Logo Component
  const ProvnLogo = () => (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-provn-accent to-provn-accent/80 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-provn-bg rounded-sm transform rotate-12"></div>
        </div>
        <div className="absolute inset-0 w-8 h-8 bg-provn-accent/20 rounded-lg blur-sm"></div>
      </div>
      <div className="font-headline font-bold">
        <span className="text-2xl text-provn-text">Prov</span>
        <span className="text-2xl text-provn-accent">n</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-provn-bg">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/5 via-transparent to-orange-100/5"></div>
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #ff6d01 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <div className="w-full p-6 border-b border-provn-border/50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/whitelist">
              <ProvnLogo />
            </Link>
            <Link 
              href="/whitelist" 
              className="text-provn-muted hover:text-provn-text transition-colors text-sm"
            >
              ← Back to Whitelist
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <ProvnCard className="bg-provn-surface/95 backdrop-blur-sm border border-provn-border/50 shadow-xl">
            <ProvnCardContent className="p-8 lg:p-12">
              {/* Header */}
              <div className="flex items-center space-x-3 mb-8">
                <ShieldCheckIcon className="w-8 h-8 text-provn-accent" />
                <div>
                  <h1 className="font-headline text-3xl font-bold text-provn-text">
                    Privacy Policy
                  </h1>
                  <p className="text-provn-muted text-sm">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="prose prose-invert max-w-none">
                {/* Introduction */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4 flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2 text-provn-accent" />
                    Introduction
                  </h2>
                  <p className="text-provn-muted leading-relaxed mb-4">
                    At Provn (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our decentralized content platform and related services.
                  </p>
                  <p className="text-provn-muted leading-relaxed">
                    By accessing or using Provn, you agree to the collection and use of information in accordance with this Privacy Policy.
                  </p>
                </section>

                {/* Information We Collect */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4">Information We Collect</h2>
                  
                  <h3 className="text-lg font-medium text-provn-text mb-3">Wallet Information</h3>
                  <ul className="text-provn-muted space-y-2 mb-4 pl-4">
                    <li>• Wallet addresses you connect to our platform</li>
                    <li>• Transaction data related to platform interactions</li>
                    <li>• Digital signatures for authentication purposes</li>
                  </ul>

                  <h3 className="text-lg font-medium text-provn-text mb-3">Social Media Information</h3>
                  <ul className="text-provn-muted space-y-2 mb-4 pl-4">
                    <li>• Twitter/X username and profile information (when you connect your account)</li>
                    <li>• Public profile data for verification purposes</li>
                    <li>• Account metrics for quality assessment</li>
                  </ul>

                  <h3 className="text-lg font-medium text-provn-text mb-3">Contact Information</h3>
                  <ul className="text-provn-muted space-y-2 mb-4 pl-4">
                    <li>• Email addresses (when provided for whitelist access)</li>
                    <li>• Communication preferences</li>
                  </ul>

                  <h3 className="text-lg font-medium text-provn-text mb-3">Usage Information</h3>
                  <ul className="text-provn-muted space-y-2 mb-4 pl-4">
                    <li>• IP addresses and device information</li>
                    <li>• Browser type and version</li>
                    <li>• Platform usage analytics and patterns</li>
                    <li>• Content interactions and preferences</li>
                  </ul>
                </section>

                {/* How We Use Information */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4">How We Use Your Information</h2>
                  <p className="text-provn-muted leading-relaxed mb-4">
                    We use the collected information for the following purposes:
                  </p>
                  <ul className="text-provn-muted space-y-2 pl-4">
                    <li>• <strong className="text-provn-text">Authentication:</strong> Verify user identity and prevent fraudulent access</li>
                    <li>• <strong className="text-provn-text">Platform Access:</strong> Manage whitelist applications and platform access</li>
                    <li>• <strong className="text-provn-text">Communication:</strong> Send important updates and notifications</li>
                    <li>• <strong className="text-provn-text">Improvement:</strong> Analyze usage patterns to enhance user experience</li>
                    <li>• <strong className="text-provn-text">Security:</strong> Detect and prevent abuse, fraud, and security threats</li>
                    <li>• <strong className="text-provn-text">Compliance:</strong> Meet legal and regulatory requirements</li>
                  </ul>
                </section>

                {/* Data Sharing */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4">Information Sharing and Disclosure</h2>
                  <p className="text-provn-muted leading-relaxed mb-4">
                    We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:
                  </p>
                  <ul className="text-provn-muted space-y-2 pl-4">
                    <li>• <strong className="text-provn-text">Service Providers:</strong> Third-party services that help us operate our platform (with strict confidentiality agreements)</li>
                    <li>• <strong className="text-provn-text">Legal Requirements:</strong> When required by law, court order, or government request</li>
                    <li>• <strong className="text-provn-text">Security Protection:</strong> To protect our rights, property, or safety, and that of our users</li>
                    <li>• <strong className="text-provn-text">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with user notification)</li>
                  </ul>
                </section>

                {/* Data Security */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4">Data Security</h2>
                  <p className="text-provn-muted leading-relaxed mb-4">
                    We implement industry-standard security measures to protect your information:
                  </p>
                  <ul className="text-provn-muted space-y-2 pl-4">
                    <li>• Encryption of data in transit and at rest</li>
                    <li>• Regular security audits and monitoring</li>
                    <li>• Access controls and authentication requirements</li>
                    <li>• Secure infrastructure and hosting</li>
                    <li>• Regular security updates and patches</li>
                  </ul>
                  <p className="text-provn-muted leading-relaxed mt-4">
                    However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                  </p>
                </section>

                {/* User Rights */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4">Your Rights and Choices</h2>
                  <p className="text-provn-muted leading-relaxed mb-4">
                    Depending on your jurisdiction, you may have the following rights regarding your personal information:
                  </p>
                  <ul className="text-provn-muted space-y-2 pl-4">
                    <li>• <strong className="text-provn-text">Access:</strong> Request access to your personal information</li>
                    <li>• <strong className="text-provn-text">Correction:</strong> Request correction of inaccurate information</li>
                    <li>• <strong className="text-provn-text">Deletion:</strong> Request deletion of your personal information</li>
                    <li>• <strong className="text-provn-text">Portability:</strong> Request transfer of your data to another service</li>
                    <li>• <strong className="text-provn-text">Objection:</strong> Object to certain types of data processing</li>
                    <li>• <strong className="text-provn-text">Restriction:</strong> Request restriction of data processing</li>
                  </ul>
                </section>

                {/* Blockchain and Decentralization */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4">Blockchain and Decentralized Data</h2>
                  <p className="text-provn-muted leading-relaxed mb-4">
                    As a Web3 platform, some of your data may be stored on blockchain networks or decentralized systems:
                  </p>
                  <ul className="text-provn-muted space-y-2 pl-4">
                    <li>• Blockchain data is public and immutable by nature</li>
                    <li>• We cannot modify or delete data stored on public blockchains</li>
                    <li>• Your wallet address and transaction history may be publicly visible</li>
                    <li>• Smart contract interactions are permanent and cannot be undone</li>
                  </ul>
                </section>

                {/* International Transfers */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4">International Data Transfers</h2>
                  <p className="text-provn-muted leading-relaxed">
                    Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
                  </p>
                </section>

                {/* Data Retention */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4">Data Retention</h2>
                  <p className="text-provn-muted leading-relaxed">
                    We retain your personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. When information is no longer needed, we securely delete or anonymize it.
                  </p>
                </section>

                {/* Updates */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4">Updates to This Policy</h2>
                  <p className="text-provn-muted leading-relaxed">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. Your continued use of our services after such modifications constitutes acceptance of the updated Privacy Policy.
                  </p>
                </section>

                {/* Contact */}
                <section className="mb-8">
                  <h2 className="text-xl font-semibold text-provn-text mb-4">Contact Us</h2>
                  <p className="text-provn-muted leading-relaxed mb-4">
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us through:
                  </p>
                  <ul className="text-provn-muted space-y-2 pl-4">
                    <li>• Twitter/X: <a href="https://x.com/provndotfun" target="_blank" rel="noopener noreferrer" className="text-provn-accent hover:underline">@provndotfun</a></li>
                    <li>• Platform: Through our official support channels</li>
                  </ul>
                </section>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t border-provn-border">
                <div className="text-center">
                  <p className="text-provn-muted text-sm">
                    This Privacy Policy is effective as of {new Date().toLocaleDateString()} and applies to all users of the Provn platform.
                  </p>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>
        </div>
      </div>
    </div>
  )
}