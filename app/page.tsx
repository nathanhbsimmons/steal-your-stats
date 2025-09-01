import { AppShell, AppShellNavigation, AppShellContent } from '@/components/app-shell';
import { Window, WindowHeader, WindowBody, WindowFooter } from '@/components/ui/window';
import { Sidebar, NavSection, NavItem } from '@/components/ui/sidebar';
import { Pill } from '@/components/ui/pill';
import { DisplayHeading, Subhead, BodyText } from '@/components/ui/typography';

export default function Home() {
  return (
    <AppShell>
      <AppShellNavigation>
        <Window>
          <WindowHeader>
            <span className="font-mono text-sm">Navigation</span>
          </WindowHeader>
          <WindowBody>
            <Sidebar>
              <NavSection title="Main">
                <NavItem href="/" isActive>
                  Dashboard
                </NavItem>
                <NavItem href="/search">
                  Search Songs
                </NavItem>
                <NavItem href="/recent">
                  Recent Shows
                </NavItem>
              </NavSection>
              
              <NavSection title="Browse">
                <NavItem href="/artists">
                  Artists
                </NavItem>
                <NavItem href="/venues">
                  Venues
                </NavItem>
                <NavItem href="/eras">
                  Eras
                </NavItem>
              </NavSection>
              
              <NavSection title="Tools">
                <NavItem href="/stats">
                  Statistics
                </NavItem>
                <NavItem href="/export">
                  Export Data
                </NavItem>
              </NavSection>
            </Sidebar>
          </WindowBody>
        </Window>
      </AppShellNavigation>
      
      <AppShellContent>
        <Window>
          <WindowHeader>
            <span className="font-mono text-sm">Main Content</span>
          </WindowHeader>
          <WindowBody>
            <div className="space-y-6">
              <div>
                <DisplayHeading>Steal Your Stats</DisplayHeading>
                <Subhead>
                  Explore the complete performance history of your favorite songs with detailed statistics, 
                  audio playback, and comprehensive show data.
                </Subhead>
              </div>
              
              <div className="space-y-4">
                <BodyText size="lg">
                  This app provides deep insights into live music performances, tracking everything from 
                  first and last shows to encore appearances and venue statistics.
                </BodyText>
                
                <div className="flex flex-wrap gap-2">
                  <Pill variant="active">Live Music</Pill>
                  <Pill variant="outline">Statistics</Pill>
                  <Pill variant="outline">Audio Archive</Pill>
                  <Pill variant="outline">Show History</Pill>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-ink rounded-radius-md p-4">
                  <DisplayHeading as="h3" className="text-xl lg:text-2xl mb-2">Quick Stats</DisplayHeading>
                  <BodyText size="sm">
                    Get started by searching for a song to see its performance history.
                  </BodyText>
                </div>
                
                <div className="border-2 border-ink rounded-radius-md p-4">
                  <DisplayHeading as="h3" className="text-xl lg:text-2xl mb-2">Recent Activity</DisplayHeading>
                  <BodyText size="sm">
                    View the latest shows and performances added to the database.
                  </BodyText>
                </div>
              </div>
            </div>
          </WindowBody>
          <WindowFooter>
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink/60">Ready for development</p>
              <div className="flex gap-2">
                <Pill variant="outline" size="sm">v0.1.0</Pill>
                <Pill variant="outline" size="sm">Beta</Pill>
              </div>
            </div>
          </WindowFooter>
        </Window>
      </AppShellContent>
    </AppShell>
  );
}
