import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube, Activity } from "lucide-react"

export default function SiteFooter() {
  return (
    <footer className="border-t bg-secondary text-white">
      <div className="container py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-base sm:text-lg font-bold">PostureSense</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              AI-powered posture analysis for physio clinics and gyms.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <Link href="#" className="text-gray-400 hover:text-primary">
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary">
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary">
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-primary">
                <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Features</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/workouts" className="text-gray-400 hover:text-primary">
                  Workout Library
                </Link>
              </li>
              <li>
                <Link href="/nutrition" className="text-gray-400 hover:text-primary">
                  Nutrition Planning
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-400 hover:text-primary">
                  Progress Tracking
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-gray-400 hover:text-primary">
                  Community Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Resources</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/blogs" className="text-gray-400 hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/health-guides" className="text-gray-400 hover:text-primary">
                  Health Guides
                </Link>
              </li>
              <li>
                <Link href="/nutrition-tips" className="text-gray-400 hover:text-primary">
                  Nutrition Tips
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-primary">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/about-us" className="text-gray-400 hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-primary">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-of-service" className="text-gray-400 hover:text-primary">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-800 text-center text-xs sm:text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} PostureSense. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

