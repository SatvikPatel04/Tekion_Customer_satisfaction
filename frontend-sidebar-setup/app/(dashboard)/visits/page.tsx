"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

const API_BASE_URL = "http://localhost:5000/api"

interface Customer {
  _id: string
  name: string
}

interface Dealership {
  _id: string
  company: string
}

interface Visit {
  _id: string
  customerId?: { name: string }
  dealershipId?: { company: string }
  visitDate: string
  visitType: string
  query?: string
  wasIssueResolved: boolean
  price?: number
  serviceDelayInDays: number
  repeatIssues?: number
  feedback?: {
    feedbackProvided: boolean
    stars?: number
    comment?: string
  }
}

function formatDate(date: string | Date) {
  if (!date) return ""
  return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function daysAgo(date: string | Date) {
  if (!date) return ""
  const d = new Date(date)
  const now = new Date()
  const diff = Math.ceil((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return "today"
  if (diff === 1) return "yesterday"
  return `${diff} days ago`
}

function calculateVisitRiskScore(visit: Visit) {
  let score = 100
  const positives: string[] = []
  const riskFactors: string[] = []

  // Feedback
  if (visit.feedback?.stars && visit.feedback.stars >= 4) {
    score += 15
    positives.push("High Customer Feedback")
  } else if (visit.feedback?.feedbackProvided) {
    score -= (4 - (visit.feedback.stars || 0)) * 7
    if (visit.feedback.stars && visit.feedback.stars <= 2) riskFactors.push("Low Customer Feedback")
  } else {
    riskFactors.push("No Feedback Provided")
    score -= 8
  }

  // Issue resolved?
  if (visit.wasIssueResolved) {
    score += 12
    positives.push("Issue Resolved")
  } else {
    riskFactors.push("Issue Not Resolved")
    score -= 20
  }

  // Service delay
  if (visit.serviceDelayInDays > 2) {
    score -= (visit.serviceDelayInDays - 2) * 4
    riskFactors.push(`Service Delay: ${visit.serviceDelayInDays} days`)
  } else if (visit.serviceDelayInDays <= 1) {
    positives.push("Quick Service Turnaround")
  }

  // Price
  if (visit.price && visit.price > 35000) {
    score -= Math.floor((visit.price - 35000) / 2000)
    riskFactors.push("Unusually High Price")
  } else if (visit.price && visit.price < 15000) {
    positives.push("Good Price")
  }

  // Repeat Issues
  if (visit.repeatIssues && visit.repeatIssues > 0) {
    riskFactors.push(`Repeat Issues: ${visit.repeatIssues}`)
    score -= visit.repeatIssues * 12
  } else {
    positives.push("No Repeat Issues")
  }

  // Clamp, then set Level
  score = Math.max(0, Math.min(130, score))
  let riskLevel = "SAFE"
  if (score < 80) riskLevel = "AT RISK"
  if (score < 50) riskLevel = "CRITICAL"

  // AI Narrative
  const breakdown = `The visit is assessed at a risk score of ${score} (${riskLevel}). 
    ${positives.length ? `Strengths include: ${positives.join(", ")}. ` : ""}
    ${riskFactors.length ? `Concerns: ${riskFactors.join("; ")}.` : ""}
    Overall, this visit ${
      riskLevel === "SAFE"
        ? "shows satisfactory engagement."
        : riskLevel === "AT RISK"
          ? "requires attention to improve retention."
          : "is problematic and requires urgent action."
    }
  `

  // Suggestions
  const suggestions: string[] = []
  if (riskFactors.includes("Issue Not Resolved")) suggestions.push("Address unresolved issue immediately.")
  if (riskFactors.find((f) => f.startsWith("Service Delay")))
    suggestions.push("Consider compensatory measure for delay.")
  if (riskFactors.includes("No Feedback Provided")) suggestions.push("Reach out for detailed feedback.")
  if (positives.includes("No Repeat Issues"))
    suggestions.push("Maintain quick, quality service to uphold satisfaction.")
  if (riskLevel === "SAFE") suggestions.push("No immediate action required.")
  if (riskLevel === "CRITICAL") suggestions.push("Management intervention recommended.")

  return {
    riskScore: score,
    riskLevel,
    positives,
    riskFactors,
    breakdown,
    suggestions,
  }
}

export default function VisitsPage() {
  const [activeTab, setActiveTab] = useState<"form" | "analysis">("form")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [dealerships, setDealerships] = useState<Dealership[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [selectedVisitId, setSelectedVisitId] = useState<string>("")
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const [formData, setFormData] = useState({
    customerId: "",
    dealershipId: "",
    visitDate: "",
    wasIssueResolved: false,
    price: "",
    serviceDelayInDays: "0",
    repeatIssues: "0",
    feedback: {
      stars: "",
      feedbackProvided: false,
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, dealershipsRes, visitsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/customers`),
          fetch(`${API_BASE_URL}/dealerships`),
          fetch(`${API_BASE_URL}/visits`),
        ])

        if (customersRes.ok) {
          const customersData = await customersRes.json()
          setCustomers(customersData)
        }

        if (dealershipsRes.ok) {
          const dealershipsData = await dealershipsRes.json()
          setDealerships(dealershipsData)
        }

        if (visitsRes.ok) {
          const visitsData = await visitsRes.json()
          setVisits(visitsData)
        }
      } catch (error) {
        console.log("[v0] Failed to fetch data:", error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedVisitId && activeTab === "analysis") {
      const fetchVisitDetails = async () => {
        setAnalysisLoading(true)
        try {
          const response = await fetch(`${API_BASE_URL}/visits/${selectedVisitId}`)
          if (response.ok) {
            const visitData = await response.json()
            setSelectedVisit(visitData)
          }
        } catch (error) {
          console.log("[v0] Failed to fetch visit details:", error)
        } finally {
          setAnalysisLoading(false)
        }
      }
      fetchVisitDetails()
    }
  }, [selectedVisitId, activeTab])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const submitData = {
        customerId: formData.customerId,
        dealershipId: formData.dealershipId,
        visitDate: formData.visitDate,
        serviceDelayInDays: Number(formData.serviceDelayInDays),
        price: Number(formData.price),
        wasIssueResolved: formData.wasIssueResolved,
        repeatIssues: Number(formData.repeatIssues),
        feedback: {
          feedbackProvided: formData.feedback.feedbackProvided,
          stars: formData.feedback.stars ? Number(formData.feedback.stars) : null,
        },
      }

      const response = await fetch(`${API_BASE_URL}/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        throw new Error("Failed to create visit")
      }

      setMessage({ type: "success", text: "Visit added successfully!" })
      setFormData({
        customerId: "",
        dealershipId: "",
        visitDate: "",
        wasIssueResolved: false,
        price: "",
        serviceDelayInDays: "0",
        repeatIssues: "0",
        feedback: { stars: "", feedbackProvided: false },
      })

      const visitsRes = await fetch(`${API_BASE_URL}/visits`)
      if (visitsRes.ok) {
        const visitsData = await visitsRes.json()
        setVisits(visitsData)
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to add visit. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const analysis = selectedVisit ? calculateVisitRiskScore(selectedVisit) : null

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Visit Management</h1>
        <p className="text-muted-foreground mt-2">Add and analyze customer visits</p>
      </div>

      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("form")}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === "form"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Add Visit
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === "analysis"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Visit Analysis
        </button>
      </div>

      {activeTab === "form" ? (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer *</Label>
              <select
                id="customer"
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dealership">Dealership *</Label>
              <select
                id="dealership"
                required
                value={formData.dealershipId}
                onChange={(e) => setFormData({ ...formData, dealershipId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select a dealership</option>
                {dealerships.map((dealership) => (
                  <option key={dealership._id} value={dealership._id}>
                    {dealership.company}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitDate">Visit Date *</Label>
              <Input
                id="visitDate"
                type="date"
                required
                value={formData.visitDate}
                onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  required
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Enter price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay">Service Delay (days) *</Label>
                <Input
                  id="delay"
                  type="number"
                  required
                  value={formData.serviceDelayInDays}
                  onChange={(e) => setFormData({ ...formData, serviceDelayInDays: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repeatIssues">Repeat Issues *</Label>
              <Input
                id="repeatIssues"
                type="number"
                required
                min="0"
                value={formData.repeatIssues}
                onChange={(e) => setFormData({ ...formData, repeatIssues: e.target.value })}
                placeholder="Number of repeat issues"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="resolved"
                checked={formData.wasIssueResolved}
                onCheckedChange={(checked) => setFormData({ ...formData, wasIssueResolved: checked as boolean })}
              />
              <Label htmlFor="resolved" className="cursor-pointer">
                Issue was resolved *
              </Label>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold">Feedback</h3>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feedbackProvided"
                  checked={formData.feedback.feedbackProvided}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      feedback: { ...formData.feedback, feedbackProvided: checked as boolean },
                    })
                  }
                />
                <Label htmlFor="feedbackProvided" className="cursor-pointer">
                  Feedback was provided *
                </Label>
              </div>

              {formData.feedback.feedbackProvided && (
                <div className="space-y-2">
                  <Label htmlFor="stars">Rating (1-5 stars)</Label>
                  <Input
                    id="stars"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.feedback.stars}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feedback: { ...formData.feedback, stars: e.target.value },
                      })
                    }
                    placeholder="Optional: Enter rating if feedback provided"
                  />
                </div>
              )}
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Adding..." : "Add Visit"}
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Visit Risk Analysis</h2>
              <p className="text-muted-foreground mb-6">
                Select a visit to analyze risk factors and get recommendations
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitSelect">Select Visit</Label>
              <select
                id="visitSelect"
                value={selectedVisitId}
                onChange={(e) => setSelectedVisitId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Choose a visit to analyze</option>
                {visits.map((visit) => (
                  <option key={visit._id} value={visit._id}>
                    {visit.customerId?.name || "Unknown"} - {visit.dealershipId?.company || "Unknown"} -{" "}
                    {formatDate(visit.visitDate)} ({visit.visitType})
                  </option>
                ))}
              </select>
            </div>

            {analysisLoading && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {!analysisLoading && selectedVisit && analysis && (
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-lg mb-3">Visit Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <span className="ml-2 font-medium">
                        {formatDate(selectedVisit.visitDate)} ({daysAgo(selectedVisit.visitDate)})
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="ml-2 font-medium">{selectedVisit.customerId?.name || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dealership:</span>
                      <span className="ml-2 font-medium">{selectedVisit.dealershipId?.company || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Service Delay:</span>
                      <span className="ml-2 font-medium">{selectedVisit.serviceDelayInDays} days</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>
                      <span className="ml-2 font-medium">₹{selectedVisit.price?.toLocaleString() || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Feedback:</span>
                      <span className="ml-2 font-medium">
                        {selectedVisit.feedback?.feedbackProvided
                          ? `${selectedVisit.feedback.stars} / 5 stars`
                          : "No feedback"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Issue Resolved:</span>
                      <span
                        className={`ml-2 font-medium ${selectedVisit.wasIssueResolved ? "text-green-600" : "text-red-600"}`}
                      >
                        {selectedVisit.wasIssueResolved ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Repeat Issues:</span>
                      <span className="ml-2 font-medium">{selectedVisit.repeatIssues || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold">Risk Score: {analysis.riskScore}</h3>
                      <p
                        className={`text-lg font-semibold ${
                          analysis.riskLevel === "SAFE"
                            ? "text-green-600"
                            : analysis.riskLevel === "AT RISK"
                              ? "text-orange-600"
                              : "text-red-600"
                        }`}
                      >
                        {analysis.riskLevel}
                      </p>
                    </div>
                    <div
                      className={`text-6xl ${
                        analysis.riskLevel === "SAFE"
                          ? "text-green-600"
                          : analysis.riskLevel === "AT RISK"
                            ? "text-orange-600"
                            : "text-red-600"
                      }`}
                    >
                      {analysis.riskLevel === "SAFE" ? "🟢" : analysis.riskLevel === "AT RISK" ? "🟠" : "🔴"}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        analysis.riskLevel === "SAFE"
                          ? "bg-green-600"
                          : analysis.riskLevel === "AT RISK"
                            ? "bg-orange-600"
                            : "bg-red-600"
                      }`}
                      style={{ width: `${Math.min(analysis.riskScore, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Risk score is based on feedback, service delay, price, issue resolution & repeat issues
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-3">What went right</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.positives.length > 0 ? (
                      analysis.positives.map((positive) => (
                        <span key={positive} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {positive}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        No positives detected
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-red-600 mb-3">What went wrong</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.riskFactors.length > 0 ? (
                      analysis.riskFactors.map((factor) => (
                        <span key={factor} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                          {factor}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">No major risks</span>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-primary p-4 rounded">
                  <h3 className="font-semibold mb-2">AI-Style Analysis</h3>
                  <p className="text-sm text-gray-700">{analysis.breakdown}</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Suggestions / Next Steps</h3>
                  <div className="space-y-2">
                    {analysis.suggestions.map((suggestion) => (
                      <div
                        key={suggestion}
                        className={`px-4 py-2 rounded-lg ${
                          suggestion.includes("immediate") || suggestion.includes("urgent")
                            ? "bg-red-100 text-red-800"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!analysisLoading && !selectedVisit && selectedVisitId && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Unable to load visit details. Please try again.</p>
              </div>
            )}

            {!selectedVisitId && !analysisLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Select a visit from the dropdown above to view its risk analysis</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
