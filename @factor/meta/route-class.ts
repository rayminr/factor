import { addFilter, addCallback, pushToFilter } from "@factor/api"
import Vue, { Component } from "vue"

import { getObservables } from "@factor/app/extend-app"

const key = "routeClass"

declare module "vue" {
  interface Component {
    routeClass: string[] | string | Function
  }
}

const setRouteClass = (options: Component): void => {
  if (!options) return

  const { routeClass } = options
  if (routeClass) {
    let routeClassArray = typeof routeClass === "function" ? routeClass() : routeClass

    if (typeof routeClassArray == "string") routeClassArray = [routeClassArray]
    else if (!routeClassArray) return

    getObservables().routeClass.push(...routeClassArray)
  }
}

addCallback({
  key,
  hook: "ssr-context-callbacks",
  callback: ({ matchedComponents }: { matchedComponents: Component[] }) =>
    matchedComponents.forEach((_: Component) => setRouteClass(_)),
})

const manageClient = (): void => {
  addCallback({
    key,
    hook: "client-route-after",
    callback: () => {
      getObservables().routeClass = []
    },
  })

  Vue.mixin(
    Vue.extend({
      watch: {
        $route: {
          handler: function (): void {
            setRouteClass(this.$options as Component)
          },
          immediate: true,
        },
      },
    })
  )
}

addFilter({
  key,
  hook: "before-app",
  callback: () => {
    if (process.env.FACTOR_BUILD_ENV !== "server") manageClient()
  },
})

addFilter({
  key,
  hook: "register-global-observables",
  callback: (__: Record<string, any>) => {
    return { ...__, routeClass: [] }
  },
})

pushToFilter({ key, hook: "observable-class-keys", item: "routeClass" })
