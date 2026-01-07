"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const API_BASE_URL = "http://localhost:5000/api"

interface Dealership {
  _id: string
  company: string
  uniqueName: string
}

interface Customer {
  _id: string
  name: string
  car?: {
    model?: string
    year?: number
    registrationNumber?: string
  }
  dealershipId?: string | { _id: string; company: string }
}

interface Visit {
  _id: string
  customerId: string | { _id: string }
  dealershipId?: { company: string }
  visitDate?: string
  price: number
  serviceDelayInDays: number
  wasIssueResolved: boolean
  repeatIssues: number
  feedback?: {
    feedbackProvided: boolean
    stars?: number
  }
}

function calculateVisitRiskScore(visit: Visit) {
  let score = 100
  const positives: string[] = []
  const riskFactors: string[] = []

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

  if (visit.wasIssueResolved) {
    score += 12
    positives.push("Issue Resolved")
  } else {
    riskFactors.push("Issue Not Resolved")
    score -= 20
  }

  if (visit.serviceDelayInDays > 2) {
    score -= (visit.serviceDelayInDays - 2) * 4
    riskFactors.push(`Service Delay: ${visit.serviceDelayInDays} days`)
  } else if (visit.serviceDelayInDays <= 1) {
    positives.push("Quick Service Turnaround")
  }

  if (visit.price > 35000) {
    score -= Math.floor((visit.price - 35000) / 2000)
    riskFactors.push("Unusually High Price")
  } else if (visit.price < 15000) {
    positives.push("Good Price")
  }

  if (visit.repeatIssues > 0) {
    riskFactors.push(`Repeat Issues: ${visit.repeatIssues}`)
    score -= visit.repeatIssues * 12
  } else {
    positives.push("No Repeat Issues")
  }

  score = Math.max(0, Math.min(130, score))
  let riskLevel = "SAFE"
  let color = "success"
  if (score < 80) {
    riskLevel = "AT RISK"
    color = "warning"
  }
  if (score < 50) {
    riskLevel = "CRITICAL"
    color = "error"
  }

  return { riskScore: score, riskLevel, color, positives, riskFactors }
}

function CustomerAnalysis() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.log("[v0] Failed to fetch customers:", error)
    }
  }

  const fetchCustomerAnalysis = async (customerId: string) => {
    setLoading(true)
    try {
      const customerRes = await fetch(`${API_BASE_URL}/customers/${customerId}`)
      const visitsRes = await fetch(`${API_BASE_URL}/visits`)

      if (customerRes.ok && visitsRes.ok) {
        const customerData = await customerRes.json()
        const allVisitsData = await visitsRes.json()

        // Filter visits for the selected customer only
        const customerVisits = Array.isArray(allVisitsData)
          ? allVisitsData.filter((visit: Visit) => {
              const visitCustomerId = typeof visit.customerId === "object" ? visit.customerId._id : visit.customerId
              return visitCustomerId === customerId
            })
          : []

        setSelectedCustomer(customerData)
        setVisits(customerVisits)
      }
    } catch (error) {
      console.log("[v0] Failed to fetch analysis:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId)
    if (customerId) {
      fetchCustomerAnalysis(customerId)
    } else {
      setSelectedCustomer(null)
      setVisits([])
    }
  }

  const visitScores = visits.map((v) => calculateVisitRiskScore(v))
  const avgScore = visitScores.length
    ? Math.round(visitScores.reduce((a, s) => a + s.riskScore, 0) / visitScores.length)
    : 0

  let totalLevel = "SAFE"
  let levelColor = "text-teal-600 bg-teal-50"
  if (avgScore < 80) {
    totalLevel = "AT RISK"
    levelColor = "text-orange-600 bg-orange-50"
  }
  if (avgScore < 50) {
    totalLevel = "CRITICAL"
    levelColor = "text-red-600 bg-red-50"
  }

  const suggestions = []
  if (!visits.length) {
    suggestions.push("No visits yet - reach out to get feedback!")
  } else if (totalLevel === "CRITICAL") {
    suggestions.push("Contact customer for urgent satisfaction recovery")
  } else if (totalLevel === "AT RISK") {
    suggestions.push("Initiate follow-up, review major issues, incentivize retention")
  } else {
    suggestions.push("Maintain regular touchpoints and reward loyalty")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="customerSelect">Select Customer</Label>
        <select
          id="customerSelect"
          value={selectedCustomerId}
          onChange={(e) => handleCustomerSelect(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select a customer to analyze</option>
          {customers.map((customer) => (
            <option key={customer._id} value={customer._id}>
              {customer.name}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      )}

      {selectedCustomer && !loading && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-4">Customer Analysis</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Name:</span> {selectedCustomer.name}
              </div>
              <div>
                <span className="font-semibold">Total Visits:</span> {visits.length}
              </div>
              {selectedCustomer.car?.model && (
                <div>
                  <span className="font-semibold">Car:</span> {selectedCustomer.car.model}{" "}
                  {selectedCustomer.car.year && `(${selectedCustomer.car.year})`}
                </div>
              )}
              {selectedCustomer.car?.registrationNumber && (
                <div>
                  <span className="font-semibold">Registration:</span> {selectedCustomer.car.registrationNumber}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Average Risk Score:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${levelColor}`}>
                {avgScore} - {totalLevel}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${
                  totalLevel === "SAFE" ? "bg-teal-600" : totalLevel === "AT RISK" ? "bg-orange-500" : "bg-red-500"
                }`}
                style={{ width: `${Math.min(avgScore, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Customer risk is calculated from all visits, based on feedback, repeat issues, price, and service
              experience.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Customer &quot;{selectedCustomer.name}&quot; has an average risk score of {avgScore} ({totalLevel}).{" "}
              {visits.length === 0
                ? "No visits on record for this customer."
                : `Across ${visits.length} visits, this customer shows ${totalLevel === "SAFE" ? "positive engagement and retention" : "potential engagement issues requiring follow-up"}.`}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Suggestions / Next Steps</h4>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    s.includes("urgent") ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700"
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {visits.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Recent Visits</h4>
              <div className="space-y-3">
                {visits
                  .slice(-3)
                  .reverse()
                  .map((visit) => {
                    const score = calculateVisitRiskScore(visit)
                    return (
                      <Card key={visit._id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">
                              {typeof visit.dealershipId === "object"
                                ? visit.dealershipId?.company
                                : "Unknown Dealership"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString() : "No date"}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              score.riskLevel === "SAFE"
                                ? "bg-teal-100 text-teal-700"
                                : score.riskLevel === "AT RISK"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {score.riskLevel}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Rs. {visit.price.toLocaleString()}</p>
                          <p>Feedback: {visit.feedback?.feedbackProvided ? `${visit.feedback.stars} ★` : "None"}</p>
                          <p>Issue {visit.wasIssueResolved ? "Resolved" : "Unresolved"}</p>
                        </div>
                      </Card>
                    )
                  })}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default function CustomersPage() {
  const [dealerships, setDealerships] = useState<Dealership[]>([])
  const [formData, setFormData] = useState({
    name: "",
    car: {
      model: "",
      year: "",
      registrationNumber: "",
    },
    dealershipId: "",
    isHighValueCustomer: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const fetchDealerships = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/dealerships`)
        if (response.ok) {
          const data = await response.json()
          setDealerships(data)
        }
      } catch (error) {
        console.log("[v0] Failed to fetch dealerships:", error)
      }
    }
    fetchDealerships()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const submitData = {
        ...formData,
        car: {
          ...formData.car,
          year: formData.car.year ? Number(formData.car.year) : undefined,
        },
      }

      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        throw new Error("Failed to create customer")
      }

      setMessage({ type: "success", text: "Customer added successfully!" })
      setFormData({
        name: "",
        car: { model: "", year: "", registrationNumber: "" },
        dealershipId: "",
        isHighValueCustomer: false,
      })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to add customer. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
        <p className="text-muted-foreground mt-2">Add new customers or analyze existing customer data</p>
      </div>

      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="form">Add Customer</TabsTrigger>
          <TabsTrigger value="analysis">Customer Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Car Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="carModel">Car Model</Label>
                  <Input
                    id="carModel"
                    value={formData.car.model}
                    onChange={(e) => setFormData({ ...formData, car: { ...formData.car, model: e.target.value } })}
                    placeholder="Enter car model"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carYear">Year</Label>
                  <Input
                    id="carYear"
                    type="number"
                    value={formData.car.year}
                    onChange={(e) => setFormData({ ...formData, car: { ...formData.car, year: e.target.value } })}
                    placeholder="Enter year"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.car.registrationNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, car: { ...formData.car, registrationNumber: e.target.value } })
                    }
                    placeholder="Enter registration number"
                  />
                </div>
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
                      {dealership.company} ({dealership.uniqueName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="highValue"
                  checked={formData.isHighValueCustomer}
                  onCheckedChange={(checked) => setFormData({ ...formData, isHighValueCustomer: checked as boolean })}
                />
                <Label htmlFor="highValue" className="cursor-pointer">
                  High Value Customer
                </Label>
              </div>

              {message && (
                <div
                  className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                >
                  {message.text}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Adding..." : "Add Customer"}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card className="p-6">
            <CustomerAnalysis />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
