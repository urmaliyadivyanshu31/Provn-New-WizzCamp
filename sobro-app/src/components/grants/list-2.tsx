import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface Stock {
  id: string
  name: string
  company: string
  logo: string
  change: number
}

interface List02Props {
  stocks?: Stock[]
  className?: string
}

const STOCKS: Stock[] = [
  {
    id: "1",
    name: "ARLA",
    company: "Arla Plc",
    logo: "/placeholder.svg?height=32&width=32",
    change: 4.5,
  },
  {
    id: "2",
    name: "BUA CEMENT",
    company: "Bua Cement Plc",
    logo: "/placeholder.svg?height=32&width=32",
    change: 4.5,
  },
  {
    id: "3",
    name: "NIGERIAN BREWERIES",
    company: "Nigerian Breweries Plc",
    logo: "/placeholder.svg?height=32&width=32",
    change: 4.5,
  },
  {
    id: "4",
    name: "MTN",
    company: "MTN Plc",
    logo: "/placeholder.svg?height=32&width=32",
    change: 4.5,
  },
  {
    id: "5",
    name: "UBA",
    company: "UBA Plc",
    logo: "/placeholder.svg?height=32&width=32",
    change: 4.5,
  },
  {
    id: "6",
    name: "NESTLE",
    company: "Nestle Plc",
    logo: "/placeholder.svg?height=32&width=32",
    change: -14.44,
  },
  {
    id: "7",
    name: "FCMB",
    company: "FCMB Plc",
    logo: "/placeholder.svg?height=32&width=32",
    change: -14.44,
  },
  {
    id: "8",
    name: "GLO",
    company: "Glo Plc",
    logo: "/placeholder.svg?height=32&width=32",
    change: -14.44,
  },
  {
    id: "9",
    name: "GTCO",
    company: "GTCo Plc",
    logo: "/placeholder.svg?height=32&width=32",
    change: -14.44,
  },
  {
    id: "10",
    name: "FMN",
    company: "FMN Plc",
    logo: "/placeholder.svg?height=32&width=32",
    change: -14.44,
  },
]

export default function List02({ stocks = STOCKS, className }: List02Props) {
  return (
    <div className={cn("w-full", className)}>
      <div className="space-y-1">
        {stocks.map((stock) => (
          <div
            key={stock.id}
            className={cn(
              "group flex items-center gap-3",
              "p-2 rounded-lg",
              "hover:bg-gray-50 dark:hover:bg-gray-800/50",
              "transition-all duration-200",
              "cursor-pointer",
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <img src={stock.logo || "/placeholder.svg"} alt={stock.name} className="w-5 h-5" />
            </div>

            <div className="flex-1 flex items-center justify-between min-w-0">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {stock.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stock.company}</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-sm font-medium",
                    stock.change > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
                    "group-hover:font-bold transition-all duration-200",
                  )}
                >
                  {stock.change > 0 ? "+" : ""}
                  {stock.change}%
                </span>
                {stock.change > 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-200" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-200" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
