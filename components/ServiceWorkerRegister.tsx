'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            if (process.env.NODE_ENV !== 'development') {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    const foundRegistration = registrations.find(
                        (registration) =>
                            registration.active?.scriptURL === `${window.location.origin}/sw.js`
                    )

                    if (!foundRegistration) {
                        navigator.serviceWorker.register('/sw.js')
                    }
                })
            } else {
                // In development, unregister to avoid caching issues
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => {
                        registration.unregister()
                    })
                })

                caches.keys().then(function (names) {
                    for (let name of names) {
                        caches.delete(name)
                    }
                })
            }
        }
    }, [])

    return null
}
