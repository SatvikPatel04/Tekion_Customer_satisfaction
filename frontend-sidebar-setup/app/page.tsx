"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  TrendingUp,
  Users,
  BarChart3,
  Shield,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Image
                src="/tekion-logo.png"
                alt="Tekion"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="text-xl font-bold text-gray-900">Tekion</span>
            </div>
            <Link href="/dashboard">
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-full mb-6 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Transforming Customer Experience
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 text-balance">
              Track, Analyze, and Improve Customer Satisfaction
            </h1>
            <p className="text-xl text-gray-600 mb-8 text-pretty max-w-2xl mx-auto">
              Empower your automotive dealership with real-time customer
              insights, predictive risk analysis, and actionable recommendations
              to deliver exceptional service experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8 h-12"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 h-12 border-gray-300 bg-transparent"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Hero Image Placeholder */}
          <div className="mt-16 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <img
                src="/images/image.png"
                alt="Tekion Dashboard Analytics Overview"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-teal-100">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">50%</div>
              <div className="text-teal-100">Faster Issue Resolution</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">3x</div>
              <div className="text-teal-100">Better Retention</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">
                Real-time
              </div>
              <div className="text-teal-100">Risk Detection</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Delight Customers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools to monitor, analyze, and improve every
              customer interaction
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow border-gray-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Risk Score Analysis
              </h3>
              <p className="text-gray-600">
                AI-powered risk scoring identifies at-risk customers before they
                churn, giving you time to act.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-gray-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Customer Insights
              </h3>
              <p className="text-gray-600">
                Deep dive into individual customer histories, preferences, and
                satisfaction patterns.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-gray-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Dealership Performance
              </h3>
              <p className="text-gray-600">
                Track and compare dealership metrics to identify top performers
                and areas for improvement.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-gray-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Visit Monitoring
              </h3>
              <p className="text-gray-600">
                Comprehensive tracking of every service visit with automated
                quality assurance checks.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-gray-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Real-time Alerts
              </h3>
              <p className="text-gray-600">
                Get instant notifications when customer satisfaction drops or
                issues arise.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow border-gray-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Actionable Recommendations
              </h3>
              <p className="text-gray-600">
                AI-generated suggestions help you address problems before they
                escalate.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, powerful workflow to transform your customer experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Collect Data
              </h3>
              <p className="text-gray-600">
                Track customer visits, feedback, service delays, and pricing
                automatically through our intuitive forms.
              </p>
              <div className="mt-6">
                <img
                  src="/data-collection-form-interface.jpg"
                  alt="Data Collection"
                  className="rounded-lg shadow-md mx-auto border border-gray-200"
                />
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analyze Risk
              </h3>
              <p className="text-gray-600">
                Our AI engine processes visit data and calculates risk scores
                based on multiple satisfaction factors.
              </p>
              <div className="mt-6">
                <img
                  src="/analytics-dashboard-risk-assessment.jpg"
                  alt="Risk Analysis"
                  className="rounded-lg shadow-md mx-auto border border-gray-200"
                />
              </div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Take Action
              </h3>
              <p className="text-gray-600">
                Get personalized recommendations to address issues and improve
                customer satisfaction proactively.
              </p>
              <div className="mt-6">
                <img
                  src="/action-recommendations-notification.jpg"
                  alt="Take Action"
                  className="rounded-lg shadow-md mx-auto border border-gray-200"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Achieve Measurable Results
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Reduce Customer Churn by 40%
                    </h3>
                    <p className="text-gray-600">
                      Identify at-risk customers early and take proactive
                      measures to retain them.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Cut Response Time in Half
                    </h3>
                    <p className="text-gray-600">
                      Real-time alerts and automated workflows help you address
                      issues faster.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Increase Revenue by 25%
                    </h3>
                    <p className="text-gray-600">
                      Happy customers return more often and spend more on
                      services.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Improve Service Quality Scores
                    </h3>
                    <p className="text-gray-600">
                      Data-driven insights help dealerships consistently deliver
                      exceptional experiences.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <img
                src="/business-results-dashboard-metrics-charts.jpg"
                alt="Results Dashboard"
                className="rounded-2xl shadow-2xl border border-gray-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Customer Experience?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Join leading dealerships using Tekion to deliver exceptional service
            and drive customer loyalty.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-white text-teal-600 hover:bg-gray-100 text-lg px-8 h-12"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image
              src="/tekion-logo.png"
              alt="Tekion"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-xl font-bold text-white">Tekion</span>
          </div>
          <p className="text-sm">
            Transforming automotive customer experience through intelligent
            analytics
          </p>
          <p className="text-sm mt-4">© 2026 Tekion. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
