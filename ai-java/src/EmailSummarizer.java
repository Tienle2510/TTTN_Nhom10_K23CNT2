import java.util.*;

public class EmailSummarizer {

    /*
     * =====================================================
     * TỪ KHÓA KHÔNG MANG NHIỀU Ý NGHĨA
     * =====================================================
     */

    private static final Set<String> STOP_WORDS =
        new HashSet<>(Arrays.asList(

            "và",
            "là",
            "của",
            "cho",
            "trong",
            "các",
            "một",
            "những",
            "được",
            "với",
            "đến",
            "này",
            "đó",
            "theo",
            "từ",
            "để",
            "khi",
            "có",
            "đã",
            "sẽ",
            "rằng",
            "như",
            "về",
            "tại",
            "trên",
            "bạn",
            "xin",
            "vui",
            "lòng",
            "hoặc",
            "nên",
            "thì",
            "rất",
            "đang",
            "cũng",
            "sau",
            "trước",
            "email",
            "thông",
            "tin"

        ));


    /*
     * =====================================================
     * PHÂN TÍCH EMAIL
     * =====================================================
     */

    public static Map<String, Object> summarize(
        String sender,
        String subject,
        String content
    ) {

        Map<String, Object> result =
            new LinkedHashMap<>();


        String cleanContent =
            cleanText(content);


        String fullText =
            (
                (subject == null ? "" : subject)
                + ". "
                + cleanContent
            ).trim();


        /*
         * -------------------------------------------------
         * TÁCH CÂU
         * -------------------------------------------------
         */

        List<String> sentences =
            splitSentences(fullText);


        /*
         * -------------------------------------------------
         * TÓM TẮT
         * -------------------------------------------------
         */

        String summary =
            createSummary(sentences);


        /*
         * -------------------------------------------------
         * NỘI DUNG CHÍNH
         * -------------------------------------------------
         */

        List<String> keyPoints =
            extractKeyPoints(sentences);


        /*
         * -------------------------------------------------
         * TỪ KHÓA
         * -------------------------------------------------
         */

        List<String> keywords =
            extractKeywords(cleanContent);


        /*
         * -------------------------------------------------
         * KẾT QUẢ
         * -------------------------------------------------
         */

        result.put(
            "summary",
            summary
        );

        result.put(
            "keyPoints",
            keyPoints
        );

        result.put(
            "keywords",
            keywords
        );


        return result;
    }


    /*
     * =====================================================
     * LÀM SẠCH TEXT
     * =====================================================
     */

    private static String cleanText(
        String text
    ) {

        if (text == null) {
            return "";
        }


        String result =
            text;


        /*
         * Xóa HTML script
         */

        result =
            result.replaceAll(
                "<script[^>]*>[\\s\\S]*?</script>",
                " "
            );


        /*
         * Xóa HTML style
         */

        result =
            result.replaceAll(
                "<style[^>]*>[\\s\\S]*?</style>",
                " "
            );


        /*
         * Xóa các thẻ HTML
         */

        result =
            result.replaceAll(
                "<[^>]+>",
                " "
            );


        /*
         * Decode HTML entity
         */

        result =
            result.replace(
                "&nbsp;",
                " "
            );

        result =
            result.replace(
                "&amp;",
                "&"
            );

        result =
            result.replace(
                "&lt;",
                "<"
            );

        result =
            result.replace(
                "&gt;",
                ">"
            );


        /*
         * Xóa URL
         */

        result =
            result.replaceAll(
                "https?://\\S+",
                " "
            );


        /*
         * Chuẩn hóa khoảng trắng
         */

        result =
            result.replaceAll(
                "\\s+",
                " "
            );


        return result.trim();
    }


    /*
     * =====================================================
     * TÁCH CÂU
     * =====================================================
     */

    private static List<String> splitSentences(
        String text
    ) {

        List<String> sentences =
            new ArrayList<>();


        if (
            text == null ||
            text.trim().isEmpty()
        ) {

            return sentences;
        }


        String[] parts =
            text.split(
                "(?<=[.!?;])\\s+"
            );


        for (
            String part :
            parts
        ) {

            String sentence =
                part.trim();


            if (
                sentence.length() >= 10
            ) {

                sentences.add(
                    sentence
                );
            }
        }


        return sentences;
    }


    /*
     * =====================================================
     * TẠO TÓM TẮT
     * =====================================================
     */

    private static String createSummary(
        List<String> sentences
    ) {

        if (sentences.isEmpty()) {

            return "Không có đủ nội dung để tóm tắt.";
        }


        if (sentences.size() == 1) {

            return limitText(
                sentences.get(0),
                500
            );
        }


        /*
         * Tính tần suất từ
         */

        Map<String, Integer> wordFrequency =
            calculateWordFrequency(
                sentences
            );


        List<SentenceScore> scores =
            new ArrayList<>();


        /*
         * Tính điểm cho từng câu
         */

        for (
            int i = 0;
            i < sentences.size();
            i++
        ) {

            String sentence =
                sentences.get(i);


            double score =
                calculateSentenceScore(
                    sentence,
                    wordFrequency
                );


            /*
             * Ưu tiên câu đầu
             */

            if (i == 0) {
                score += 2.0;
            }


            scores.add(
                new SentenceScore(
                    i,
                    sentence,
                    score
                )
            );
        }


        /*
         * Sắp xếp theo điểm giảm dần
         */

        scores.sort(
            (
                a,
                b
            ) ->
                Double.compare(
                    b.score,
                    a.score
                )
        );


        /*
         * Chọn tối đa 3 câu
         */

        int count =
            Math.min(
                3,
                scores.size()
            );


        List<SentenceScore> selected =
            new ArrayList<>(
                scores.subList(
                    0,
                    count
                )
            );


        /*
         * Đưa về thứ tự xuất hiện ban đầu
         */

        selected.sort(
            Comparator.comparingInt(
                item ->
                    item.index
            )
        );


        StringBuilder summary =
            new StringBuilder();


        for (
            SentenceScore item :
            selected
        ) {

            if (
                summary.length() > 0
            ) {

                summary.append(" ");
            }


            summary.append(
                item.sentence
            );
        }


        return limitText(
            summary.toString(),
            700
        );
    }


    /*
     * =====================================================
     * TÍNH TẦN SUẤT TỪ
     * =====================================================
     */

    private static Map<String, Integer>
    calculateWordFrequency(
        List<String> sentences
    ) {

        Map<String, Integer> frequency =
            new HashMap<>();


        for (
            String sentence :
            sentences
        ) {

            String[] words =
                normalizeWords(
                    sentence
                );


            for (
                String word :
                words
            ) {

                if (
                    word.length() < 3
                ) {

                    continue;
                }


                if (
                    STOP_WORDS.contains(
                        word
                    )
                ) {

                    continue;
                }


                frequency.put(
                    word,
                    frequency.getOrDefault(
                        word,
                        0
                    ) + 1
                );
            }
        }


        return frequency;
    }


    /*
     * =====================================================
     * TÍNH ĐIỂM CÂU
     * =====================================================
     */

    private static double
    calculateSentenceScore(
        String sentence,
        Map<String, Integer> frequency
    ) {

        String[] words =
            normalizeWords(
                sentence
            );


        double score =
            0;


        for (
            String word :
            words
        ) {

            if (
                word.length() < 3
            ) {

                continue;
            }


            if (
                STOP_WORDS.contains(
                    word
                )
            ) {

                continue;
            }


            score +=
                frequency.getOrDefault(
                    word,
                    0
                );
        }


        /*
         * Tránh ưu tiên câu quá dài
         */

        if (
            words.length > 0
        ) {

            score =
                score /
                Math.sqrt(
                    words.length
                );
        }


        /*
         * Các cụm từ quan trọng
         */

        String lower =
            sentence.toLowerCase();


        String[] importantWords = {

            "quan trọng",
            "thời gian",
            "ngày",
            "hạn",
            "deadline",
            "thanh toán",
            "học phí",
            "thi",
            "lịch",
            "thông báo",
            "yêu cầu",
            "cần",
            "vui lòng",
            "xác nhận",
            "mật khẩu",
            "tài khoản",
            "giao dịch"

        };


        for (
            String keyword :
            importantWords
        ) {

            if (
                lower.contains(
                    keyword
                )
            ) {

                score += 3;
            }
        }


        return score;
    }


    /*
     * =====================================================
     * TRÍCH XUẤT NỘI DUNG CHÍNH
     * =====================================================
     */

    private static List<String>
    extractKeyPoints(
        List<String> sentences
    ) {

        List<String> result =
            new ArrayList<>();


        if (
            sentences.isEmpty()
        ) {

            return result;
        }


        Map<String, Integer> frequency =
            calculateWordFrequency(
                sentences
            );


        List<SentenceScore> scores =
            new ArrayList<>();


        for (
            int i = 0;
            i < sentences.size();
            i++
        ) {

            String sentence =
                sentences.get(i);


            double score =
                calculateSentenceScore(
                    sentence,
                    frequency
                );


            scores.add(
                new SentenceScore(
                    i,
                    sentence,
                    score
                )
            );
        }


        /*
         * Sắp xếp theo điểm
         */

        scores.sort(
            (
                a,
                b
            ) ->
                Double.compare(
                    b.score,
                    a.score
                )
        );


        /*
         * Chọn tối đa 5 câu
         */

        int count =
            Math.min(
                5,
                scores.size()
            );


        List<SentenceScore> selected =
            new ArrayList<>(
                scores.subList(
                    0,
                    count
                )
            );


        /*
         * Giữ thứ tự ban đầu
         */

        selected.sort(
            Comparator.comparingInt(
                item ->
                    item.index
            )
        );


        /*
         * Đưa vào kết quả
         */

        for (
            SentenceScore item :
            selected
        ) {

            result.add(
                limitText(
                    item.sentence,
                    300
                )
            );
        }


        return result;
    }


    /*
     * =====================================================
     * TRÍCH XUẤT KEYWORDS
     * =====================================================
     */

    private static List<String>
    extractKeywords(
        String text
    ) {

        Map<String, Integer> frequency =
            new HashMap<>();


        String[] words =
            normalizeWords(
                text
            );


        for (
            String word :
            words
        ) {

            if (
                word.length() < 4
            ) {

                continue;
            }


            if (
                STOP_WORDS.contains(
                    word
                )
            ) {

                continue;
            }


            frequency.put(
                word,
                frequency.getOrDefault(
                    word,
                    0
                ) + 1
            );
        }


        /*
         * Sắp xếp từ khóa theo tần suất
         */

        List<Map.Entry<String, Integer>>
            entries =
            new ArrayList<>(
                frequency.entrySet()
            );


        entries.sort(
            (
                a,
                b
            ) ->
                Integer.compare(
                    b.getValue(),
                    a.getValue()
                )
        );


        List<String> result =
            new ArrayList<>();


        /*
         * Tối đa 8 từ khóa
         */

        int count =
            Math.min(
                8,
                entries.size()
            );


        for (
            int i = 0;
            i < count;
            i++
        ) {

            result.add(
                entries
                    .get(i)
                    .getKey()
            );
        }


        return result;
    }


    /*
     * =====================================================
     * CHUẨN HÓA TỪ
     * =====================================================
     */

    private static String[]
    normalizeWords(
        String text
    ) {

        if (
            text == null ||
            text.trim().isEmpty()
        ) {

            return new String[0];
        }


        return text
            .toLowerCase()
            .replaceAll(
                "[^\\p{L}\\p{N}\\s]",
                " "
            )
            .replaceAll(
                "\\s+",
                " "
            )
            .trim()
            .split(" ");
    }


    /*
     * =====================================================
     * GIỚI HẠN ĐỘ DÀI
     * =====================================================
     */

    private static String limitText(
        String text,
        int maxLength
    ) {

        if (text == null) {
            return "";
        }


        if (
            text.length() <= maxLength
        ) {

            return text;
        }


        return text
            .substring(
                0,
                maxLength
            )
            .trim()
            + "...";
    }


    /*
     * =====================================================
     * CLASS SCORE
     * =====================================================
     */

    private static class SentenceScore {

        int index;

        String sentence;

        double score;


        SentenceScore(
            int index,
            String sentence,
            double score
        ) {

            this.index =
                index;

            this.sentence =
                sentence;

            this.score =
                score;
        }
    }
}