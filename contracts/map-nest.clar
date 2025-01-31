;; Define token for rewards
(define-fungible-token nest-token)

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-exists (err u102))
(define-constant err-unauthorized (err u103))

;; Data structures
(define-map locations 
  { location-id: uint }
  {
    name: (string-utf8 100),
    description: (string-utf8 500),
    category: (string-utf8 50),
    lat: int,
    long: int,
    creator: principal,
    verified: bool,
    rating: uint,
    review-count: uint
  }
)

(define-map reviews
  { location-id: uint, reviewer: principal }
  {
    rating: uint,
    comment: (string-utf8 500),
    timestamp: uint
  }
)

;; Data vars
(define-data-var next-location-id uint u1)

;; Add new location
(define-public (add-location 
  (name (string-utf8 100))
  (description (string-utf8 500))
  (category (string-utf8 50))
  (lat int)
  (long int))
  (let
    ((location-id (var-get next-location-id)))
    (map-insert locations
      { location-id: location-id }
      {
        name: name,
        description: description,
        category: category,
        lat: lat,
        long: long,
        creator: tx-sender,
        verified: false,
        rating: u0,
        review-count: u0
      }
    )
    (var-set next-location-id (+ location-id u1))
    (ok location-id)))

;; Add review
(define-public (add-review
  (location-id uint)
  (rating uint)
  (comment (string-utf8 500)))
  (let
    ((location (unwrap! (map-get? locations {location-id: location-id}) (err err-not-found))))
    (map-insert reviews
      { location-id: location-id, reviewer: tx-sender }
      {
        rating: rating,
        comment: comment,
        timestamp: block-height
      }
    )
    ;; Update location rating
    (map-set locations
      { location-id: location-id }
      (merge location
        {
          rating: (/ (+ (* (get rating location) (get review-count location)) rating)
                    (+ u1 (get review-count location))),
          review-count: (+ u1 (get review-count location))
        }
      )
    )
    ;; Reward reviewer with tokens
    (ft-mint? nest-token u5 tx-sender)))

;; Verify location
(define-public (verify-location (location-id uint))
  (if (is-eq tx-sender contract-owner)
    (let
      ((location (unwrap! (map-get? locations {location-id: location-id}) (err err-not-found))))
      (map-set locations
        { location-id: location-id }
        (merge location { verified: true })
      )
      (ok true))
    (err err-unauthorized)))
