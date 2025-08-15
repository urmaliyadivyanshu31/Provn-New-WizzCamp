import { MapPin, Calendar, DollarSign, Users, Award, Globe, Camera, Video, FileText } from "lucide-react"
import { useUserProfile } from "@/hooks/useUserProfile"

export default function GrantsContent() {
  const { getFirstName } = useUserProfile()
  const featuredGrants = [
    {
      id: 1,
      title: "Southeast Asia Adventure Grant",
      organization: "Travel Foundation",
      amount: "$5,000",
      deadline: "Dec 15, 2024",
      location: "Thailand, Vietnam, Cambodia",
      type: "Photography",
      applicants: 45,
      description: "Document traditional cultures and hidden gems across Southeast Asia",
      tags: ["Photography", "Culture", "Adventure"],
    },
    {
      id: 2,
      title: "European Heritage Documentation",
      organization: "Cultural Heritage Fund",
      amount: "$8,000",
      deadline: "Jan 20, 2025",
      location: "Europe",
      type: "Video",
      applicants: 32,
      description: "Create video content showcasing European historical sites",
      tags: ["Video", "History", "Architecture"],
    },
    {
      id: 3,
      title: "Sustainable Tourism Initiative",
      organization: "Green Travel Collective",
      amount: "$3,500",
      deadline: "Nov 30, 2024",
      location: "Costa Rica",
      type: "Blog",
      applicants: 28,
      description: "Write about eco-friendly travel practices and sustainable destinations",
      tags: ["Writing", "Sustainability", "Eco-tourism"],
    },
  ]

  const stats = [
    { label: "Active Grants", value: "127", icon: Award, color: "text-blue-600 dark:text-blue-400" },
    { label: "Total Funding", value: "$2.4M", icon: DollarSign, color: "text-green-600 dark:text-green-400" },
    { label: "Content Creators", value: "1,250", icon: Users, color: "text-purple-600 dark:text-purple-400" },
    { label: "Countries Covered", value: "89", icon: Globe, color: "text-orange-600 dark:text-orange-400" },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "application",
      title: "Applied to Japan Cultural Grant",
      time: "2 hours ago",
      status: "pending",
    },
    {
      id: 2,
      type: "approval",
      title: "Morocco Adventure Grant - Approved!",
      time: "1 day ago",
      status: "approved",
    },
    {
      id: 3,
      type: "submission",
      title: "Submitted content for Iceland Grant",
      time: "3 days ago",
      status: "completed",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white p-8 rounded-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {getFirstName()}! 🌍</h1>
          <p className="text-blue-100 mb-6">Ready to explore new destinations and share your stories with the world?</p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105">
              Browse Grants
            </button>
            <button className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105">
              Submit Content
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-[#0F0F12] p-6 rounded-xl border border-gray-200 dark:border-[#1F1F23] hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Featured Grants */}
      <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Featured Grants</h2>
          <p className="text-gray-600 dark:text-gray-400">High-value opportunities perfect for your content style</p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-[#1F1F23]">
          {featuredGrants.map((grant) => (
            <div
              key={grant.id}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{grant.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{grant.organization}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">{grant.amount}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Funding</p>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">{grant.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {grant.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{grant.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Due {grant.deadline}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{grant.applicants} applicants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {grant.type === "Photography" && <Camera className="w-4 h-4" />}
                      {grant.type === "Video" && <Video className="w-4 h-4" />}
                      {grant.type === "Blog" && <FileText className="w-4 h-4" />}
                      <span>{grant.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:ml-6">
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
                    Apply Now
                  </button>
                  <button className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors duration-200">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23]">
          <div className="p-6 border-b border-gray-200 dark:border-[#1F1F23]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.status === "approved"
                        ? "bg-green-500"
                        : activity.status === "pending"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                    }`}
                  ></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white dark:bg-[#0F0F12] rounded-xl border border-gray-200 dark:border-[#1F1F23]">
          <div className="p-6 border-b border-gray-200 dark:border-[#1F1F23]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Participants</h3>
          </div>
          <div className="p-6 h-80">
            <div className="space-y-4 overflow-y-auto h-full">
              {Array.from({ length: 15 }, (_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200">
                  <img
                    src={`https://api.dicebear.com/7.x/avatars/svg?seed=participant${i}`}
                    alt={`Participant ${i + 1}`}
                    className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Emma Brown', 'Frank Miller', 'Grace Lee', 'Henry Clark', 'Ivy Chen', 'Jack Taylor', 'Kate Robinson', 'Liam Garcia', 'Maya Patel', 'Noah Kim', 'Olivia Martinez'][i]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {['Creator', 'Traveler', 'Photographer', 'Blogger', 'Vlogger', 'Influencer', 'Writer', 'Explorer', 'Adventurer', 'Content Creator', 'Digital Nomad', 'Travel Guide', 'Storyteller', 'Filmmaker', 'Artist'][i]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600 dark:text-green-400">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
