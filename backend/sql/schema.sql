CREATE DATABASE IF NOT EXISTS labour_bridge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE labour_bridge;
CREATE TABLE IF NOT EXISTS users (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 email VARCHAR(190) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL,
 role ENUM('worker','employer','admin') NOT NULL DEFAULT 'worker',
 phone VARCHAR(30) NULL,
 is_active TINYINT(1) NOT NULL DEFAULT 1,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS worker_profiles (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL UNIQUE,
 headline VARCHAR(180) NULL,
 skills TEXT NULL,
 experience_years DECIMAL(4,1) NOT NULL DEFAULT 0,
 location VARCHAR(160) NULL,
 expected_daily_wage DECIMAL(10,2) NULL,
 availability ENUM('Available','Available tomorrow','Currently working','Unavailable') NOT NULL DEFAULT 'Available',
 bio TEXT NULL,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_profile_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS jobs (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 employer_id BIGINT UNSIGNED NOT NULL,
 title VARCHAR(180) NOT NULL,
 company VARCHAR(160) NULL,
 description TEXT NOT NULL,
 category VARCHAR(100) NOT NULL DEFAULT 'General',
 location VARCHAR(160) NOT NULL,
 job_type VARCHAR(60) NOT NULL DEFAULT 'Full-time',
 wage_min DECIMAL(10,2) NOT NULL DEFAULT 0,
 wage_max DECIMAL(10,2) NULL,
 wage_period ENUM('hour','day','week','month','project') NOT NULL DEFAULT 'day',
 required_skills TEXT NULL,
 vacancies INT UNSIGNED NOT NULL DEFAULT 1,
 status ENUM('open','closed','filled') NOT NULL DEFAULT 'open',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_job_employer FOREIGN KEY(employer_id) REFERENCES users(id),
 INDEX idx_jobs_status_location(status,location),
 FULLTEXT INDEX ft_jobs_search(title,description,required_skills)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS applications (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 job_id BIGINT UNSIGNED NOT NULL,
 worker_id BIGINT UNSIGNED NOT NULL,
 cover_note TEXT NULL,
 status ENUM('submitted','reviewing','shortlisted','accepted','rejected','withdrawn') NOT NULL DEFAULT 'submitted',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_job_worker(job_id,worker_id),
 CONSTRAINT fk_app_job FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE,
 CONSTRAINT fk_app_worker FOREIGN KEY(worker_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS reports (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 reporter_id BIGINT UNSIGNED NOT NULL,
 type VARCHAR(80) NOT NULL DEFAULT 'general',
 subject VARCHAR(180) NOT NULL,
 details TEXT NOT NULL,
 status ENUM('open','investigating','resolved','dismissed') NOT NULL DEFAULT 'open',
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_report_user FOREIGN KEY(reporter_id) REFERENCES users(id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS wage_records (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 worker_id BIGINT UNSIGNED NOT NULL,
 employer_id BIGINT UNSIGNED NOT NULL,
 job_id BIGINT UNSIGNED NULL,
 work_days DECIMAL(8,2) NOT NULL,
 rate_per_day DECIMAL(10,2) NOT NULL,
 amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
 notes TEXT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT fk_wage_worker FOREIGN KEY(worker_id) REFERENCES users(id),
 CONSTRAINT fk_wage_employer FOREIGN KEY(employer_id) REFERENCES users(id),
 CONSTRAINT fk_wage_job FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS reviews (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 reviewer_id BIGINT UNSIGNED NOT NULL,
 worker_id BIGINT UNSIGNED NOT NULL,
 rating TINYINT UNSIGNED NOT NULL,
 comment TEXT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_reviewer_worker(reviewer_id,worker_id),
 CONSTRAINT chk_rating CHECK(rating BETWEEN 1 AND 5),
 CONSTRAINT fk_review_reviewer FOREIGN KEY(reviewer_id) REFERENCES users(id),
 CONSTRAINT fk_review_worker FOREIGN KEY(worker_id) REFERENCES users(id)
) ENGINE=InnoDB;
