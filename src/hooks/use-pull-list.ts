"use client"

import { useState, useEffect } from "react"

export interface PullListItem {
  releaseId: string
  addedAt: Date
}

export interface SeriesSubscription {
  seriesName: string
  subscribedAt: Date
}

interface PullListState {
  items: PullListItem[]
  subscriptions: SeriesSubscription[]
}

const STORAGE_KEY = "floppy-pull-list"

export function usePullList() {
  const [state, setState] = useState<PullListState>({
    items: [],
    subscriptions: [],
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setState({
          items: parsed.items || [],
          subscriptions: parsed.subscriptions || [],
        })
      } catch (e) {
        console.error("Failed to parse pull list from localStorage", e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [state, isLoaded])

  const addToList = (releaseId: string) => {
    setState((prev) => {
      // Don't add duplicates
      if (prev.items.some((item) => item.releaseId === releaseId)) {
        return prev
      }
      return {
        ...prev,
        items: [...prev.items, { releaseId, addedAt: new Date() }],
      }
    })
  }

  const removeFromList = (releaseId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.releaseId !== releaseId),
    }))
  }

  const isInList = (releaseId: string) => {
    return state.items.some((item) => item.releaseId === releaseId)
  }

  const subscribeToSeries = (seriesName: string) => {
    setState((prev) => {
      // Don't add duplicates
      if (prev.subscriptions.some((sub) => sub.seriesName === seriesName)) {
        return prev
      }
      return {
        ...prev,
        subscriptions: [
          ...prev.subscriptions,
          { seriesName, subscribedAt: new Date() },
        ],
      }
    })
  }

  const unsubscribeFromSeries = (seriesName: string) => {
    setState((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.filter(
        (sub) => sub.seriesName !== seriesName
      ),
    }))
  }

  const isSubscribedToSeries = (seriesName: string) => {
    return state.subscriptions.some((sub) => sub.seriesName === seriesName)
  }

  const togglePullListItem = (releaseId: string) => {
    if (isInList(releaseId)) {
      removeFromList(releaseId)
    } else {
      addToList(releaseId)
    }
  }

  const toggleSeriesSubscription = (seriesName: string) => {
    if (isSubscribedToSeries(seriesName)) {
      unsubscribeFromSeries(seriesName)
    } else {
      subscribeToSeries(seriesName)
    }
  }

  return {
    items: state.items,
    subscriptions: state.subscriptions,
    addToList,
    removeFromList,
    isInList,
    subscribeToSeries,
    unsubscribeFromSeries,
    isSubscribedToSeries,
    togglePullListItem,
    toggleSeriesSubscription,
    isLoaded,
  }
}
