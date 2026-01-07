"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

function calculateVisitRiskScore(visit: any) {
  let score = 0

  // Feedback scoring (0-40 points)
  if (visit.feedback?.feedbackProvided && visit.feedback.stars) {
    const stars = visit.feedback.stars
    if (stars === 5) score += 40
    else if (stars === 4) score += 30
    else if (stars === 3) score += 15
    else if (stars === 2) score += 5
    else score += 0
  }

  // Service delay scoring (0-30 points)
  const delay = visit.serviceDelayInDays || 0
  if (delay === 0) score += 30
  else if (delay <= 1) score += 20
  else if (delay <= 3) score += 10
  else score += 0

  // Price scoring (0-20 points)
  if (visit.price <= 1000) score += 20
  else if (visit.price <= 3000) score += 15
  else if (visit.price <= 5000) score += 10
  else score += 5

  // Issue resolution (0-30 points)
  if (visit.wasIssueResolved) score += 30
  else score += 0

  // Repeat issues penalty (subtract points)
  const repeatPenalty = (visit.repeatIssues || 0) * 10
  score -= repeatPenalty

  const finalScore = Math.max(0, Math.min(130, score))

  let level = "SAFE"
  if (finalScore >= 90) level = "SAFE"
  else if (finalScore >= 60) level = "AT RISK"
  else level = "CRITICAL"

  return { riskScore: finalScore, riskLevel: level }
}

export default function DealershipsPage() {
  const [formData, setFormData] = useState({
    company: "",
    uniqueName: "",
    address: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [dealerships, setDealerships] = useState<any[]>([])
  const [selectedDealership, setSelectedDealership] = useState("")
  const [dealershipData, setDealershipData] = useState<any>(null)
  const [visits, setVisits] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDealerships = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dealerships`)
        if (response.ok) {
          const data = await response.json()
          setDealerships(data)
        }
      } catch (err) {
        console.error("Failed to fetch dealerships:", err)
      }
    }
    fetchDealerships()
  }, [])

  useEffect(() => {
    if (!selectedDealership) {
      setDealershipData(null)
      setVisits([])
      return
    }

    const fetchDealershipData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [dealershipRes, visitsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/dealerships/${selectedDealership}`),
          fetch(`${API_BASE_URL}/visits`),
        ])

        if (!dealershipRes.ok || !visitsRes.ok) {
          throw new Error("Failed to fetch dealership data")
        }

        const dealershipData = await dealershipRes.json()
        const allVisits = await visitsRes.json()

        // Filter visits by dealership ID
        const filteredVisits = allVisits.filter((visit: any) => {
          const visitDealershipId =
            typeof visit.dealershipId === "string" ? visit.dealershipId : visit.dealershipId?._id
          return visitDealershipId === selectedDealership
        })

        setDealershipData(dealershipData)
        setVisits(filteredVisits)
      } catch (err) {
        setError("Could not fetch dealership/visits data")
      } finally {
        setLoading(false)
      }
    }

    fetchDealershipData()
  }, [selectedDealership])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/dealerships`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to create dealership")
      }

      setMessage({ type: "success", text: "Dealership added successfully!" })
      setFormData({ company: "", uniqueName: "", address: "" })

      const updatedList = await fetch(`${API_BASE_URL}/dealerships`)
      if (updatedList.ok) {
        setDealerships(await updatedList.json())
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to add dealership. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const visitScores = visits.map((v) => calculateVisitRiskScore(v))
  const riskSum = visitScores.reduce((a, s) => a + s.riskScore, 0)
  const avgScore = visitScores.length ? Math.round(riskSum / visitScores.length) : 0
  let totalLevel = "SAFE"
  let emoji = "🟢"
  if (avgScore < 90 && avgScore >= 60) {
    totalLevel = "AT RISK"
    emoji = "🟠"
  }
  if (avgScore < 60) {
    totalLevel = "CRITICAL"
    emoji = "🔴"
  }

  let breakdown = dealershipData
    ? `Dealership "${dealershipData.company}" has an overall risk score of ${avgScore} (${totalLevel}). `
    : ""
  if (dealershipData && visits.length === 0) {
    breakdown += "No customer visits on record. No actionable signal."
  } else if (dealershipData && visits.length > 0) {
    const critical = visitScores.filter((s) => s.riskLevel === "CRITICAL").length
    const atRisk = visitScores.filter((s) => s.riskLevel === "AT RISK").length
    breakdown += `Out of ${visits.length} visits, ${critical} were classified as CRITICAL and ${atRisk} as AT RISK. `
    if (totalLevel !== "SAFE")
      breakdown +=
        "Customer experience is not optimal. Recommend reviewing recent issues and following up with dissatisfied customers."
    else breakdown += "The dealership is performing well overall."
  }

  const suggestions = []
  if (dealershipData) {
    if (!visits.length) {
      suggestions.push("Increase outreach to attract first customers.")
    } else if (totalLevel === "CRITICAL") {
      suggestions.push("Intensive QA, staff retraining, or management review immediately.")
    } else if (totalLevel === "AT RISK") {
      suggestions.push("Analyze negative visits, enhance positive factors, and engage proactively.")
    } else {
      suggestions.push("Keep up the high service standards!")
    }
  }

  const worstVisits = visits
    .map((v, i) => ({ ...v, ...visitScores[i] }))
    .filter((v) => v.riskLevel !== "SAFE")
    .sort((a, b) => a.riskScore - b.riskScore)
    .slice(0, 3)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Dealership Data</h1>
        <p className="text-muted-foreground mt-2">Manage dealership information and view analysis</p>
      </div>

      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="form">Add Dealership</TabsTrigger>
          <TabsTrigger value="analysis">Dealership Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uniqueName">Unique Name *</Label>
                <Input
                  id="uniqueName"
                  required
                  value={formData.uniqueName}
                  onChange={(e) => setFormData({ ...formData, uniqueName: e.target.value })}
                  placeholder="Enter unique identifier"
                />
                <p className="text-sm text-muted-foreground">This must be unique across all dealerships</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter dealership address"
                />
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                >
                  {message.text}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Adding..." : "Add Dealership"}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dealership-select">Select Dealership</Label>
                <select
                  id="dealership-select"
                  value={selectedDealership}
                  onChange={(e) => setSelectedDealership(e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="">-- Choose a dealership --</option>
                  {dealerships.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.company} ({d.uniqueName})
                    </option>
                  ))}
                </select>
              </div>

              {loading && <div className="text-center py-8 text-muted-foreground">Loading dealership data...</div>}

              {error && <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">{error}</div>}

              {dealershipData && !loading && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-2xl font-bold mb-4">Dealership Analysis</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-semibold">{dealershipData.company}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Unique Name</p>
                        <p className="font-semibold">{dealershipData.uniqueName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-semibold">{dealershipData.address || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Visits</p>
                        <p className="font-semibold">{visits.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Average Risk Score</p>
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-4 py-2 rounded-lg font-bold text-lg ${
                            totalLevel === "SAFE"
                              ? "bg-green-500/20 text-green-600"
                              : totalLevel === "AT RISK"
                                ? "bg-yellow-500/20 text-yellow-600"
                                : "bg-red-500/20 text-red-600"
                          }`}
                        >
                          {avgScore}
                        </div>
                        <span className="font-semibold">
                          {totalLevel} {emoji}
                        </span>
                      </div>
                    </div>

                    <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          totalLevel === "SAFE"
                            ? "bg-green-500"
                            : totalLevel === "AT RISK"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Math.min(avgScore, 100)}%` }}
                      />
                    </div>

                    <div className="p-4 bg-blue-500/10 text-blue-600 rounded-lg">
                      <p className="text-sm">{breakdown}</p>
                    </div>

                    <div>
                      <p className="font-semibold mb-2">Suggestions / Next Steps</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm ${
                              s.includes("immediately") ? "bg-red-500/20 text-red-600" : "bg-primary/20 text-primary"
                            }`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Visits with High Risk</h3>
                      {worstVisits.length === 0 ? (
                        <p className="text-muted-foreground">No at-risk visits recently.</p>
                      ) : (
                        <div className="space-y-3">
                          {worstVisits.map((v) => (
                            <Card key={v._id} className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">{v.customerId?.name || "Anonymous Customer"}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {v.visitDate?.slice(0, 10)} | Rs. {v.price} | Feedback:{" "}
                                    {v.feedback?.feedbackProvided ? `${v.feedback.stars}★` : "None"}
                                  </p>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    v.riskLevel === "SAFE"
                                      ? "bg-green-500/20 text-green-600"
                                      : v.riskLevel === "AT RISK"
                                        ? "bg-yellow-500/20 text-yellow-600"
                                        : "bg-red-500/20 text-red-600"
                                  }`}
                                >
                                  Score: {v.riskScore} ({v.riskLevel})
                                </span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!selectedDealership && !loading && (
                <div className="text-center py-12 text-muted-foreground">Select a dealership to view analysis</div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
