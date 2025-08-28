import { AppShell, AppShellNavigation, AppShellContent } from '@/components/app-shell';
import { Window, WindowHeader, WindowBody, WindowFooter } from '@/components/ui/window';

export default function Home() {
  return (
    <AppShell>
      <AppShellNavigation>
        <Window>
          <WindowHeader>
            <span className="font-mono text-sm">Navigation</span>
          </WindowHeader>
          <WindowBody>
            <p className="text-sm text-ink/70">Navigation content will go here</p>
          </WindowBody>
        </Window>
      </AppShellNavigation>
      
      <AppShellContent>
        <Window>
          <WindowHeader>
            <span className="font-mono text-sm">Main Content</span>
          </WindowHeader>
          <WindowBody>
            <h1 className="font-display text-3xl font-bold mb-4">Steal Your Stats</h1>
            <p className="text-ink/80">App shell ready for development.</p>
          </WindowBody>
          <WindowFooter>
            <p className="text-xs text-ink/60">Footer content</p>
          </WindowFooter>
        </Window>
      </AppShellContent>
    </AppShell>
  );
}
