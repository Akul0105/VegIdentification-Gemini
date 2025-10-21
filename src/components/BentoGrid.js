import React from 'react';
import { cn } from '../lib/utils';

export function BentoCard({ className, name, description, href, cta, background, Icon }) {
  return (
    <div
      key={name}
      className={cn(
        "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.2] dark:bg-gray-900",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" />
      <div className="relative z-10">
        <div className="flex items-center gap-4">
          {Icon && <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />}
          <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{name}</div>
        </div>
        <div className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {description}
        </div>
        {href && (
          <a
            href={href}
            className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {cta}
            <svg
              className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        )}
      </div>
      {background}
    </div>
  );
}

export function BentoGrid({ children, className }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}
