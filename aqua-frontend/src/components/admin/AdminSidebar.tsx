import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MapPin,
  Wrench,
  ImageIcon,
  Package,
  Mail,
  Settings,
  LogOut,
  ExternalLink,
  Sparkles,
  Users,
  History,
  FolderTree,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logoWhite from "@/assets/logo/logo-white.svg";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; exact?: boolean };

const overview: NavItem[] = [
  { title: "نظرة عامة", url: "/dashboard", icon: LayoutDashboard, exact: true },
];

const content: NavItem[] = [
  { title: "الخدمات", url: "/dashboard/services", icon: Wrench },
  { title: "المشاريع", url: "/dashboard/projects", icon: ImageIcon },
  { title: "المنتجات", url: "/dashboard/products", icon: Package },
  { title: "التصنيفات", url: "/dashboard/categories", icon: FolderTree },
  { title: "الفروع", url: "/dashboard/branches", icon: MapPin },
];

const ops: NavItem[] = [
  { title: "الرسائل الواردة", url: "/dashboard/messages", icon: Mail },
  { title: "المستخدمون", url: "/dashboard/users", icon: Users },
  { title: "سجل التدقيق", url: "/dashboard/audit", icon: History },
  { title: "إعدادات الموقع", url: "/dashboard/settings", icon: Settings },
];

type Props = { onSignOut: () => void; email: string };

export function AdminSidebar({ onSignOut, email }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const renderGroup = (label: string, items: NavItem[]) => (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-bold px-3">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = item.exact ? pathname === item.url : pathname.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  className={
                    active
                      ? "!bg-gradient-to-l from-ocean to-teal !text-white font-semibold shadow-sm"
                      : "hover:bg-muted/60"
                  }
                >
                  <Link to={item.url} className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" side="right">
      <SidebarHeader className="border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-3 p-2">
          <div className="size-10 rounded-xl bg-gradient-to-br from-deep to-ocean grid place-items-center shrink-0 overflow-hidden">
            <img src={logoWhite} alt="" className="h-7 w-auto" />
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="font-extrabold text-sm text-deep truncate">Aqua Pool</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3 text-teal" />
                لوحة التحكم
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {renderGroup("عام", overview)}
        {renderGroup("إدارة المحتوى", content)}
        {renderGroup("الاتصال والإعدادات", ops)}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        {!collapsed && email && (
          <div className="px-3 py-2 text-[11px] text-muted-foreground truncate" title={email}>
            متصل: <span className="font-semibold text-deep">{email}</span>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/" target="_blank" className="flex items-center gap-3">
                <ExternalLink className="h-4 w-4" />
                <span>عرض الموقع</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onSignOut}
              className="text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
