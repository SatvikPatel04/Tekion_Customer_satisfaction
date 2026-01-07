"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, TrendingUp, TrendingDown, Calendar, AlertCircle } from "lucide-react"
import Image from "next/image"

interface DashboardStats {
  totalCustomers: number
  totalDealerships: number
  totalVisits: number
  happyCustomers: number
  unhappyCustomers: number
  happyDealerships: number
  unhappyDealerships: number
  recentVisits: Array<{
    _id: string
    customerName: string
    dealershipName: string
    visitDate: string
    riskScore: number
  }>
}

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalDealerships: 0,
    totalVisits: 0,
    happyCustomers: 0,
    unhappyCustomers: 0,
    happyDealerships: 0,
    unhappyDealerships: 0,
    recentVisits: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const apiUrl = "http://localhost:5000/api"

      // Fetch all data in parallel
      const [customersRes, dealershipsRes, visitsRes] = await Promise.all([
        fetch(`${apiUrl}/customers`),
        fetch(`${apiUrl}/dealerships`),
        fetch(`${apiUrl}/visits`),
      ])

      const customers = await customersRes.json()
      const dealerships = await dealershipsRes.json()
      const visits = await visitsRes.json()

      // Calculate customer satisfaction (based on their latest visit feedback)
      const customerVisitMap = new Map()
      visits.forEach((visit: any) => {
        const customerId = visit.customerId?._id || visit.customerId
        if (!customerVisitMap.has(customerId)) {
          customerVisitMap.set(customerId, [])
        }
        customerVisitMap.get(customerId).push(visit)
      })

      let happyCustomers = 0
      let unhappyCustomers = 0

      customers.forEach((customer: any) => {
        const customerVisits = customerVisitMap.get(customer._id) || []
        if (customerVisits.length > 0) {
          // Get the latest visit
          const latestVisit = customerVisits.sort(
            (a: any, b: any) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime(),
          )[0]

          // Calculate risk score for the visit
          const riskScore = calculateVisitRiskScore(latestVisit)

          if (riskScore < 50) {
            happyCustomers++
          } else {
            unhappyCustomers++
          }
        }
      })

      // Calculate dealership satisfaction (based on average of all their visits)
      const dealershipVisitMap = new Map()
      visits.forEach((visit: any) => {
        const dealershipId = visit.dealershipId?._id || visit.dealershipId
        if (!dealershipVisitMap.has(dealershipId)) {
          dealershipVisitMap.set(dealershipId, [])
        }
        dealershipVisitMap.get(dealershipId).push(visit)
      })

      let happyDealerships = 0
      let unhappyDealerships = 0

      dealerships.forEach((dealership: any) => {
        const dealerVisits = dealershipVisitMap.get(dealership._id) || []
        if (dealerVisits.length > 0) {
          const avgRiskScore =
            dealerVisits.reduce((sum: number, visit: any) => sum + calculateVisitRiskScore(visit), 0) /
            dealerVisits.length

          if (avgRiskScore < 50) {
            happyDealerships++
          } else {
            unhappyDealerships++
          }
        }
      })

      // Get recent visits with populated data
      const recentVisits = visits
        .sort((a: any, b: any) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
        .slice(0, 5)
        .map((visit: any) => ({
          _id: visit._id,
          customerName: visit.customerId?.name || "Unknown Customer",
          dealershipName: visit.dealershipId?.company || "Unknown Dealership",
          visitDate: visit.visitDate,
          riskScore: calculateVisitRiskScore(visit),
        }))

      setStats({
        totalCustomers: customers.length,
        totalDealerships: dealerships.length,
        totalVisits: visits.length,
        happyCustomers,
        unhappyCustomers,
        happyDealerships,
        unhappyDealerships,
        recentVisits,
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateVisitRiskScore = (visit: any) => {
    let score = 0

    // Feedback score (0-30 points)
    if (visit.feedback?.feedbackProvided && visit.feedback.stars) {
      score += (5 - visit.feedback.stars) * 6
    } else if (visit.feedback?.feedbackProvided === false) {
      score += 15
    }

    // Service delay (0-25 points)
    score += Math.min(visit.serviceDelayInDays * 5, 25)

    // Price risk (0-20 points) - assuming high prices are risky
    if (visit.price > 5000) score += 20
    else if (visit.price > 3000) score += 10

    // Issue resolution (0-30 points)
    if (!visit.wasIssueResolved) score += 30

    // Repeat issues (0-25 points)
    score += Math.min(visit.repeatIssues * 12.5, 25)

    return Math.min(score, 130)
  }

  const getRiskCategory = (score: number) => {
    if (score < 40) return { label: "SAFE", color: "text-green-600" }
    if (score < 70) return { label: "AT RISK", color: "text-yellow-600" }
    return { label: "CRITICAL", color: "text-red-600" }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header with Tekion branding */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Image src="/tekion-logo.png" alt="Tekion" width={60} height={60} className="rounded-full" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tekion Dashboard</h1>
          <p className="text-muted-foreground">Customer and Dealership Analytics Overview</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dealerships</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDealerships}</div>
            <p className="text-xs text-muted-foreground">Active dealerships</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVisits}</div>
            <p className="text-xs text-muted-foreground">Service visits recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCustomers > 0 ? Math.round((stats.happyCustomers / stats.totalCustomers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Customer satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Satisfaction */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
            <CardDescription>Based on recent visit feedback and risk analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium">Happy Customers</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.happyCustomers}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="font-medium">Unhappy Customers</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.unhappyCustomers}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                <div
                  className="bg-green-600 h-full transition-all"
                  style={{
                    width: `${stats.totalCustomers > 0 ? (stats.happyCustomers / stats.totalCustomers) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-red-600 h-full transition-all"
                  style={{
                    width: `${stats.totalCustomers > 0 ? (stats.unhappyCustomers / stats.totalCustomers) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>
                  {stats.totalCustomers > 0 ? Math.round((stats.happyCustomers / stats.totalCustomers) * 100) : 0}%
                  Happy
                </span>
                <span>
                  {stats.totalCustomers > 0 ? Math.round((stats.unhappyCustomers / stats.totalCustomers) * 100) : 0}%
                  Unhappy
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dealership Performance</CardTitle>
            <CardDescription>Based on average visit satisfaction scores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium">High Performing</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{stats.happyDealerships}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span className="font-medium">Needs Attention</span>
              </div>
              <span className="text-2xl font-bold text-red-600">{stats.unhappyDealerships}</span>
            </div>
            <div className="pt-4 border-t">
              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                <div
                  className="bg-green-600 h-full transition-all"
                  style={{
                    width: `${
                      stats.totalDealerships > 0 ? (stats.happyDealerships / stats.totalDealerships) * 100 : 0
                    }%`,
                  }}
                />
                <div
                  className="bg-red-600 h-full transition-all"
                  style={{
                    width: `${
                      stats.totalDealerships > 0 ? (stats.unhappyDealerships / stats.totalDealerships) * 100 : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>
                  {stats.totalDealerships > 0 ? Math.round((stats.happyDealerships / stats.totalDealerships) * 100) : 0}
                  % Performing Well
                </span>
                <span>
                  {stats.totalDealerships > 0
                    ? Math.round((stats.unhappyDealerships / stats.totalDealerships) * 100)
                    : 0}
                  % Need Attention
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Visits */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Visits</CardTitle>
          <CardDescription>Latest 5 service visits with risk assessment</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentVisits.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No visits recorded yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentVisits.map((visit) => {
                const risk = getRiskCategory(visit.riskScore)
                return (
                  <div
                    key={visit._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{visit.customerName}</div>
                      <div className="text-sm text-muted-foreground">{visit.dealershipName}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(visit.visitDate).toLocaleDateString()}
                      </div>
                      <div className={`font-semibold text-sm ${risk.color}`}>{risk.label}</div>
                      <div className="text-sm font-medium text-muted-foreground">{visit.riskScore}/130</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
