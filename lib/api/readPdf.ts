import { supabase } from "../supabase";

/**
 * Lấy URL PDF từ Supabase
 */
export async function getPdfUrl(bookId: string, lang: string): Promise<string> {
  const { data, error } = await supabase
    .from("book_content")
    .select("pdf_url")
    .eq("book_id", bookId)
    .eq("language_id", lang)
    .maybeSingle();

  if (error) {
    console.error("Supabase error:", error.message);
    throw new Error("Lỗi khi truy vấn Supabase.");
  }

  if (!data?.pdf_url) {
    throw new Error("Không tìm thấy file PDF.");
  }

  return data.pdf_url;
}
