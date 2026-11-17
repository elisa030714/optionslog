"""
[선지로그(SeonjiLog) - Python 머신러닝 기반 유사 선지 추천 모듈 설계안 (Colab / FastAPI 연동용)]
주의: 현재 프론트엔드 MVP에서는 src/recommendation/optionRecommender.ts의 TypeScript 태그 매칭이 작동하며,
본 Python 스크립트는 기말 프로젝트 최종 단계에서 Google Colab 실험 및 API 연동에 활용할 참조 코드입니다.
"""

import json
from typing import List, Dict, Any

# Google Colab 환경에서 실행 시:
# !pip install scikit-learn numpy

def compute_tfidf_cosine_recommendations(
    questions_path: str,
    explanations_path: str,
    concepts_path: str,
    target_option_id: str,
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """
    기출 선지 텍스트 + 해설 + 연결된 개념 정의를 결합한 코퍼스(Corpus)에 대해
    TF-IDF 벡터화 및 코사인 유사도(Cosine Similarity)와 태그 가중치를 결합하여
    학습 전이(Transfer of Learning) 검증용 유사 선지를 추천합니다.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    with open(questions_path, "r", encoding="utf-8") as f:
        questions = json.load(f)
    with open(explanations_path, "r", encoding="utf-8") as f:
        explanations = json.load(f)
    with open(concepts_path, "r", encoding="utf-8") as f:
        concepts = json.load(f)

    exp_map = {e["optionId"]: e for e in explanations}
    concept_map = {c["conceptId"]: c for c in concepts}

    option_records = []
    documents = []

    for q in questions:
        for opt in q["options"]:
            oid = opt["optionId"]
            exp = exp_map.get(oid, {})
            concept_texts = [
                concept_map[cid]["conceptName"] + " " + concept_map[cid]["definition"]
                for cid in opt.get("conceptIds", [])
                if cid in concept_map
            ]
            combined_text = f"{opt['text']} {exp.get('explanation', '')} {' '.join(concept_texts)}"
            option_records.append({
                "optionId": oid,
                "questionId": q["questionId"],
                "text": opt["text"],
                "conceptIds": set(opt.get("conceptIds", [])),
                "philosopherIds": set(opt.get("philosopherIds", [])),
            })
            documents.append(combined_text)

    # 어절 및 음절 바이그램(char_wb 2~4) TF-IDF로 한국어 형태소 분석기 없이도 높은 정확도 확보
    vectorizer = TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 4))
    tfidf_matrix = vectorizer.fit_transform(documents)
    sim_matrix = cosine_similarity(tfidf_matrix)

    target_idx = next(
        (i for i, r in enumerate(option_records) if r["optionId"] == target_option_id),
        None
    )
    if target_idx is None:
        return []

    target_rec = option_records[target_idx]
    results = []

    for idx, rec in enumerate(option_records):
        if idx == target_idx:
            continue  # 현재 학습 중인 동일 선지 제외

        text_sim = float(sim_matrix[target_idx][idx])
        concept_overlap = len(target_rec["conceptIds"] & rec["conceptIds"]) / max(
            1, len(target_rec["conceptIds"] | rec["conceptIds"])
        )
        phil_overlap = len(target_rec["philosopherIds"] & rec["philosopherIds"]) / max(
            1, len(target_rec["philosopherIds"] | rec["philosopherIds"])
        )

        # 하이브리드 점수: 텍스트 코사인 유사도(40%) + 개념 태그 일치도(45%) + 사상가 일치도(15%)
        hybrid_score = round(0.40 * text_sim + 0.45 * concept_overlap + 0.15 * phil_overlap, 4)
        results.append({
            "optionId": rec["optionId"],
            "text": rec["text"],
            "tfidfCosine": round(text_sim, 4),
            "conceptOverlap": round(concept_overlap, 4),
            "hybridScore": hybrid_score,
        })

    results.sort(key=lambda x: x["hybridScore"], reverse=True)
    return results[:top_k]


if __name__ == "__main__":
    print("선지로그 Python 유사도 분석 프로토타입 스크립트입니다.")
    print("Google Colab 또는 로컬 Python 환경에서 scikit-learn 설치 후 실행할 수 있습니다.")

