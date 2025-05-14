INSERT INTO posts
(title, content, author, region, age_group, skill_level, is_recruiting)
VALUES
('테스트 모집', '모임 시간: 2024-07-01 19:00\n장소: 서울 강남구\n모인 인원: 10\n추가사항: 테스트용 게시글입니다.', '테스터', '서울', '20대', '초보', true);

CREATE TABLE post_applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_applicant (post_id, user_name),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);