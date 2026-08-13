import { useEffect, useState } from "react";
import { Keyframes } from "./ui/keyframes";
import { Landing } from "./pages/Landing";
import { EnginePage } from "./pages/EnginePage";

/**
 * Two pages, and no router dependency to get them.
 *
 * WHY TWO. A bare explorer is a toy — dots move, and a visitor who does not
 * already know what siteswap is has no reason to care. Without the story it is
 * nothing. So the story gets a page and the tool gets a page.
 *
 * WHY THIS ORDER. Nobody arrives here by chance; they arrive from a talk,
 * following a link, already interested. The landing page's job is to compress
 * the argument into about thirty seconds and then hand over the engine. It is
 * not trying to convince anyone that juggling is worth their time — that
 * already happened, in a room, before they clicked.
 *
 * WHY NO ROUTER. Two routes do not justify a dependency, and a hash survives
 * being served from a GitHub project page without any server rewrite rules.
 */
export type Route = "landing" | "engine";

function readRoute(): Route {
  return window.location.hash.replace(/^#\/?/, "") === "engine" ? "engine" : "landing";
}

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onHash = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      <Keyframes />
      {route === "engine" ? <EnginePage /> : <Landing />}
    </>
  );
}
