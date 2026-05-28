export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      boards: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          is_archived: boolean;
          is_starred: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          is_archived?: boolean;
          is_starred?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          is_archived?: boolean;
          is_starred?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      board_members: {
        Row: {
          board_id: string;
          user_id: string;
          role: "viewer" | "editor" | "admin";
          created_at: string;
        };
        Insert: {
          board_id: string;
          user_id: string;
          role?: "viewer" | "editor" | "admin";
          created_at?: string;
        };
        Update: {
          role?: "viewer" | "editor" | "admin";
        };
        Relationships: [];
      };
      columns: {
        Row: {
          id: string;
          board_id: string;
          name: string;
          position: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          name: string;
          position: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          position?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          column_id: string;
          board_id: string;
          title: string;
          description: string | null;
          position: string;
          due_date: string | null;
          labels: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          column_id: string;
          board_id: string;
          title: string;
          description?: string | null;
          position: string;
          due_date?: string | null;
          labels?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          column_id?: string;
          title?: string;
          description?: string | null;
          position?: string;
          due_date?: string | null;
          labels?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      card_comments: {
        Row: {
          id: string;
          card_id: string;
          board_id: string;
          author_id: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          board_id: string;
          author_id: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
