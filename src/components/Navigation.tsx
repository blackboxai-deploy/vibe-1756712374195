'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    description: 'Overview and quick actions'
  },
  {
    name: 'Tasks',
    href: '/tasks',
    description: 'AI-powered task management'
  },
  {
    name: 'Documents',
    href: '/documents',
    description: 'Document analysis and insights'
  },
  {
    name: 'Settings',
    href: '/settings',
    description: 'Customize your AI assistant'
  }
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h1 className="text-xl font-bold text-white">
                Personal AI Assistant
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-gray-300 hover:text-white hover:bg-gray-800"
                    )}
                  >
                    {item.name}
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-500/20 rounded-md animate-pulse" />
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Status Indicator */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">AI Online</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Mobile Navigation Component
export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-gray-800 z-50 md:hidden">
      <div className="flex justify-around items-center h-16 px-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center space-y-1 px-2 py-1 rounded-lg transition-colors",
                isActive
                  ? "text-blue-400 bg-blue-500/10"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <span className="text-xs font-medium">{item.name}</span>
              {isActive && <div className="w-1 h-1 bg-blue-400 rounded-full" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}