<?php
declare(strict_types=1);

namespace Digimium\Core;

use PDO;

final class ProductRepository
{
    private const COLS = 'product_id, product_name, duration, renew, supplier, wholesale, retail, note, link';

    public function __construct(
        private readonly PDO    $pdo,
        private readonly string $table
    ) {}

    public static function retail(PDO $pdo): self
    {
        return new self($pdo, 'products_catalog');
    }

    public static function wholesale(PDO $pdo): self
    {
        return new self($pdo, 'ws_products_catalog');
    }

    public function list(): array
    {
        $stmt = $this->pdo->query(
            "SELECT product_id, product_name, duration, renew AS renew_int,
                    supplier, wholesale, retail, note, link
             FROM {$this->table} ORDER BY product_name ASC"
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['product_id'] = isset($r['product_id']) ? (int)$r['product_id'] : null;
            $r['duration']   = isset($r['duration'])   ? (int)$r['duration']   : null;
            $r['renew_int']  = isset($r['renew_int'])  ? (int)$r['renew_int']  : 0;
            $r['renew']      = ((int)$r['renew_int'] === 1);
            $r['wholesale']  = isset($r['wholesale'])  ? (float)$r['wholesale'] : 0.0;
            $r['retail']     = isset($r['retail'])     ? (float)$r['retail']    : 0.0;
            $r['supplier']   = $r['supplier'] ?? null;
            $r['note']       = $r['note']     ?? null;
            $r['link']       = $r['link']     ?? null;
        }
        unset($r);
        return $rows;
    }

    public function options(): array
    {
        $stmt = $this->pdo->query(
            "SELECT product_id, product_name, duration, renew,
                    wholesale AS wc_price, retail AS retail_price
             FROM {$this->table} ORDER BY product_name ASC"
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) {
            $r['product_id']   = isset($r['product_id'])   ? (int)$r['product_id']     : null;
            $r['product_name'] = $r['product_name']        ?? null;
            $r['duration']     = isset($r['duration'])     ? (int)$r['duration']       : null;
            $r['renew']        = isset($r['renew'])        ? (int)$r['renew']          : 0;
            $r['wc_price']     = isset($r['wc_price'])     ? (float)$r['wc_price']     : 0.0;
            $r['retail_price'] = isset($r['retail_price']) ? (float)$r['retail_price'] : 0.0;
        }
        unset($r);
        return $rows;
    }

    public function insert(array $v): int
    {
        $this->pdo->prepare(
            "INSERT INTO {$this->table}
                 (product_name, duration, renew, supplier, wholesale, retail, note, link)
             VALUES (:product_name, :duration, :renew, :supplier, :wholesale, :retail, :note, :link)"
        )->execute([
            ':product_name' => $v['product_name'],
            ':duration'     => $v['duration'],
            ':renew'        => $v['renew'],
            ':supplier'     => $v['supplier'],
            ':wholesale'    => $v['wholesale'],
            ':retail'       => $v['retail'],
            ':note'         => $v['note'],
            ':link'         => $v['link'],
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->pdo->prepare(
            'SELECT ' . self::COLS . " FROM {$this->table} WHERE product_id = :id"
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare("DELETE FROM {$this->table} WHERE product_id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) {
            throw new NotFoundException('Record not found.');
        }
    }

    /**
     * Partial update: only touches the provided fields.
     * Returns the updated row on change, null on no-op.
     * Throws NotFoundException when $id does not exist.
     *
     * @param list<string>          $fields   SQL SET fragments, e.g. ['product_name = :product_name']
     * @param array<string,mixed>   $params   PDO bindings, must include ':id'
     * @param array<string,mixed>   $existing Current row from findById() — used for no-op detection
     */
    public function updateFields(int $id, array $fields, array $params, array $existing): ?array
    {
        $hasChange = false;
        foreach ($params as $k => $v) {
            if ($k === ':id') {
                continue;
            }
            $col = ltrim($k, ':');
            if ((string)($existing[$col] ?? '') !== (string)($v ?? '')) {
                $hasChange = true;
                break;
            }
        }
        if (!$hasChange) {
            return null;
        }
        $this->pdo->prepare(
            "UPDATE {$this->table} SET " . implode(', ', $fields) . ' WHERE product_id = :id'
        )->execute($params);
        return $this->findById($id) ?: null;
    }

    /**
     * Full-row update: replaces all 8 editable fields in one statement.
     * Throws NotFoundException when $id does not exist.
     */
    public function updateFull(int $id, array $v): void
    {
        if (!$this->findById($id)) {
            throw new NotFoundException('Record not found.');
        }
        $this->pdo->prepare(
            "UPDATE {$this->table}
             SET product_name = :product_name, duration = :duration, renew = :renew,
                 supplier = :supplier, wholesale = :wholesale, retail = :retail,
                 note = :note, link = :link
             WHERE product_id = :id"
        )->execute([
            ':id'           => $id,
            ':product_name' => $v['product_name'],
            ':duration'     => $v['duration'],
            ':renew'        => $v['renew'],
            ':supplier'     => $v['supplier'],
            ':wholesale'    => $v['wholesale'],
            ':retail'       => $v['retail'],
            ':note'         => $v['note'],
            ':link'         => $v['link'],
        ]);
    }
}
